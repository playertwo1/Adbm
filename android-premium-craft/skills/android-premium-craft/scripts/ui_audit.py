#!/usr/bin/env python3
"""Android UI craft audit: rule-based lint, theme palette contrast, color contrast, inventory.

Read-only, stdlib only. Every lint finding is a lead to verify, never a proven defect,
and a clean run is never a quality pass.

  ui_audit.py lint <root> [--format markdown|json|sarif] [--fail-on high|medium|low]
  ui_audit.py palette <root> [--format markdown|json]
  ui_audit.py contrast <foreground> <background>      (#RGB, #RRGGBB, #AARRGGBB foreground)
  ui_audit.py rules                                    list all lint rules
  ui_audit.py scan <root>                              legacy v1 inventory
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

EXCLUDE = {'.git', '.gradle', '.idea', 'build', 'out', 'node_modules', '.cxx', '.kotlin', 'generated', 'intermediates'}
SOURCE_EXTENSIONS = {'.kt', '.java', '.xml'}
MAX_FILE_SIZE = 1_000_000  # larger files are generated or vendored; skip them
MAX_FILES = 5000  # keeps a scan of a monorepo under a few seconds
SEVERITY_ORDER = {'high': 3, 'medium': 2, 'low': 1}
SUPPRESS = re.compile(r'craft-lint:\s*ignore(?:\s+([A-Z]\d{3}(?:\s*,\s*[A-Z]\d{3})*))?')
THEME_PATH = re.compile(r'(theme|color|colour|palette|token|designsystem)', re.I)
PREVIEW_OR_TEST = re.compile(r'(preview|test|sample|fixture)', re.I)


# ----------------------------------------------------------------------------- colors

def parse_color(value: str) -> tuple[float, float, float, float]:
    """Return (r, g, b, a) in 0..1. Accepts #RGB, #RRGGBB, #AARRGGBB (Android order) and 0x forms."""
    text = value.strip()
    for prefix in ('#', '0x', '0X'):
        if text.startswith(prefix):
            text = text[len(prefix):]
            break
    if not re.fullmatch(r'[0-9a-fA-F]+', text or 'x'):
        raise ValueError(f'Invalid color "{value}": use #RGB, #RRGGBB or #AARRGGBB.')
    if len(text) == 3:
        text = ''.join(ch * 2 for ch in text)
    if len(text) == 6:
        text = 'FF' + text
    if len(text) != 8:
        raise ValueError(f'Invalid color "{value}": use #RGB, #RRGGBB or #AARRGGBB.')
    a, r, g, b = (int(text[i:i + 2], 16) / 255.0 for i in (0, 2, 4, 6))
    return r, g, b, a


def parse_hex_color(value: str) -> tuple[float, float, float]:
    """Opaque color as (r, g, b). Kept for v1 compatibility."""
    r, g, b, a = parse_color(value)
    if a < 1.0:
        raise ValueError(f'"{value}" has alpha; composite it over a background with contrast_ratio().')
    return r, g, b


def composite(fg: tuple[float, float, float, float], bg: tuple[float, float, float, float]) -> tuple[float, float, float]:
    r, g, b, a = fg
    return tuple(c * a + bc * (1 - a) for c, bc in zip((r, g, b), bg[:3]))


def _luminance(rgb: tuple[float, float, float]) -> float:
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def relative_luminance(color: str) -> float:
    return _luminance(parse_hex_color(color))


def contrast_ratio(foreground: str, background: str) -> float:
    """WCAG 2.x contrast. The foreground may carry alpha; the background must be opaque."""
    bg = parse_color(background)
    if bg[3] < 1.0:
        raise ValueError('Background must be opaque (composite it over its own background first).')
    fg_rgb = composite(parse_color(foreground), bg)
    a, b = sorted((_luminance(fg_rgb), _luminance(bg[:3])), reverse=True)
    return (a + 0.05) / (b + 0.05)


# ----------------------------------------------------------------------------- files

def project_files(root: Path, extensions=SOURCE_EXTENSIONS):
    found = 0
    for path in sorted(root.rglob('*')):
        if any(part in EXCLUDE for part in path.relative_to(root).parts):
            continue
        if path.is_file() and path.suffix.lower() in extensions:
            try:
                if path.stat().st_size > MAX_FILE_SIZE:
                    continue
            except OSError:
                continue
            found += 1
            if found > MAX_FILES:
                return
            yield path


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding='utf-8', errors='replace')
    except OSError:
        return ''


# ----------------------------------------------------------------------------- lint rules

@dataclass
class Rule:
    id: str
    severity: str
    title: str
    fix: str
    doc: str
    exts: tuple[str, ...]
    pattern: Optional[re.Pattern] = None
    check: Optional[Callable[[re.Match], bool]] = None  # extra condition on a line match
    skip_path: Optional[re.Pattern] = None
    finder: Optional[Callable[[list[str], str], list[int]]] = None  # custom: returns 1-based lines


@dataclass
class Finding:
    rule: str
    severity: str
    file: str
    line: int
    title: str
    fix: str
    doc: str
    snippet: str = ''


def _num(match: re.Match, group: int = 1) -> float:
    return float(match.group(group))


def _off_grid(match: re.Match) -> bool:
    for value in re.findall(r'(\d+(?:\.\d+)?)\.dp', match.group(0)):
        v = float(value)
        if v > 2 and v % 4 != 0:
            return True
    return False


def _window_finder(trigger: re.Pattern, target: re.Pattern, span: int) -> Callable[[list[str], str], list[int]]:
    def find(lines: list[str], _path: str) -> list[int]:
        hits = []
        for i, line in enumerate(lines):
            if trigger.search(line):
                for j in range(i, min(i + span, len(lines))):
                    if target.search(lines[j]):
                        hits.append(j + 1)
                        break
        return hits
    return find


def _nested_cards(lines: list[str], _path: str) -> list[int]:
    card = re.compile(r'\b(?:Elevated|Outlined)?Card\s*\(')
    opened: list[tuple[int, int]] = []
    hits = []
    for i, line in enumerate(lines):
        if card.search(line):
            indent = len(line) - len(line.lstrip())
            if any(i - li <= 12 and indent > ind for li, ind in opened):
                hits.append(i + 1)
            opened.append((i, indent))
    return hits


def _element_finder(tag: str, condition: Callable[[str], bool]) -> Callable[[list[str], str], list[int]]:
    element = re.compile(r'<' + tag + r'\b[^>]*>', re.S)

    def find(lines: list[str], _path: str) -> list[int]:
        text = '\n'.join(lines)
        return [text.count('\n', 0, m.start()) + 1 for m in element.finditer(text) if condition(m.group(0))]
    return find


def _small_xml_target(element: str) -> bool:
    for dim in re.findall(r'layout_(?:width|height)="(\d+)dp"', element):
        if int(dim) < 48:
            return True
    return False


KT = ('.kt', '.java')
XML = ('.xml',)
D = 'modules/'

RULES: list[Rule] = [
    # Color
    Rule('C001', 'medium', 'Hard-coded color in UI code', 'Use MaterialTheme.colorScheme roles or extended tokens.',
         D + '03-system/color.md', ('.kt',), re.compile(r'\bColor\(\s*0x[0-9A-Fa-f]{6,8}\s*\)'), skip_path=THEME_PATH),
    Rule('C002', 'low', 'Named Color constant used for UI', 'Use a theme role; named colors ignore dark theme and contrast levels.',
         D + '03-system/color.md', ('.kt',), re.compile(r'\bColor\.(Red|Green|Blue|Yellow|Magenta|Cyan|Gray|LightGray|DarkGray)\b'),
         skip_path=THEME_PATH),
    Rule('C003', 'medium', 'Hex color in layout XML', 'Use ?attr/color* theme attributes.', D + '03-system/color.md', XML,
         re.compile(r'android:(?:textColor|background|tint|backgroundTint|strokeColor)="#[0-9A-Fa-f]+"'),
         skip_path=re.compile(r'values[^/\\]*[/\\]colors', re.I)),
    Rule('C004', 'medium', 'Secondary text made with alpha', 'Use onSurfaceVariant (or a defined role) and check 4.5:1.',
         D + '03-system/color.md', ('.kt',), re.compile(r'\bon(?:Surface|Background|Primary|Secondary)\.copy\(\s*alpha\s*=')),
    # Design / slop
    Rule('D002', 'low', 'Card nested inside a card', 'Flatten the inner level into a list or section.',
         D + '02-direction/anti-slop.md', ('.kt',), finder=_nested_cards),
    Rule('D003', 'low', 'Drop shadow on content', 'Prefer tonal elevation; shadows only for floating elements.',
         D + '03-system/shape-space-elevation.md', ('.kt',), re.compile(r'\.shadow\(')),
    Rule('D004', 'low', 'Emoji used in UI text', 'Use Material Symbols; emoji render differently per OEM.',
         D + '02-direction/anti-slop.md', ('.kt',), re.compile('Text\\(\\s*"[^"]*[\U0001F300-\U0001FAFF☀-➿]')),
    Rule('D005', 'low', 'Gradient brush', 'Keep gradients only where they carry meaning; check text contrast on them.',
         D + '02-direction/anti-slop.md', ('.kt',),
         re.compile(r'Brush\.(?:linear|horizontal|vertical|radial|sweep)Gradient'), skip_path=THEME_PATH),
    Rule('D006', 'low', 'Spacing off the 4dp grid', 'Use the spacing scale (2, 4, 8, 12, 16, 24, 32, 48).',
         D + '03-system/shape-space-elevation.md', ('.kt',),
         re.compile(r'(?:padding|spacedBy|Spacer\(\s*Modifier\.(?:height|width))\([^)]*\)'), check=_off_grid, skip_path=THEME_PATH),
    Rule('D010', 'medium', 'Baseline Material sample purple (#6750A4)', 'Generate a scheme from the real brand or use dynamic color.',
         D + '02-direction/anti-slop.md', KT + XML, re.compile(r'6750A4', re.I)),
    # Typography
    Rule('T001', 'medium', 'Text smaller than 12sp', 'Use 12sp+ for data and 14sp+ for content; labelSmall only for metadata.',
         D + '03-system/typography.md', KT + XML,
         re.compile(r'(?:fontSize\s*=\s*|android:textSize=")(\d+(?:\.\d+)?)\.?sp'), check=lambda m: _num(m) < 12),
    Rule('T003', 'low', 'Hard-coded fontSize in a screen', 'Use MaterialTheme.typography roles.',
         D + '03-system/typography.md', ('.kt',), re.compile(r'\bfontSize\s*=\s*\d+(?:\.\d+)?\.sp'), skip_path=THEME_PATH),
    Rule('T004', 'low', 'All-caps text', 'Use sentence case; caps hurt readability.', D + '05-components/content-and-copy.md',
         KT + XML, re.compile(r'(?:Text\(.*\.uppercase\(\)|android:textAllCaps="true")')),
    Rule('X001', 'high', 'textSize in dp ignores the user font scale', 'Use sp for text.', D + '03-system/typography.md', XML,
         re.compile(r'android:textSize="\d+(?:\.\d+)?dp"')),
    # Accessibility
    Rule('A001', 'high', 'IconButton without an accessible name', 'Give the Icon a contentDescription naming the action.',
         D + '07-accessibility/accessibility.md', ('.kt',),
         finder=_window_finder(re.compile(r'\bIconButton\s*\('), re.compile(r'contentDescription\s*=\s*null'), 6)),
    Rule('A002', 'low', 'Bare clickable without role or label', 'Use a Material component, or clickable(role=..., onClickLabel=...).',
         D + '07-accessibility/accessibility.md', ('.kt',), re.compile(r'\.clickable\s*\{')),
    Rule('A003', 'medium', 'Clickable element sized under 48dp', 'Add minimumInteractiveComponentSize() or sizeIn(48.dp).',
         D + '07-accessibility/accessibility.md', ('.kt',),
         re.compile(r'(?=.*(?:clickable|toggleable|selectable|pointerInput)).*\.(?:size|requiredSize)\((\d+)\.dp\)'),
         check=lambda m: _num(m) < 48),
    Rule('A005', 'low', 'Literal string in Text()', 'Move user-visible text to strings.xml (i18n, plurals, RTL).',
         D + '05-components/content-and-copy.md', ('.kt',), re.compile(r'\bText\(\s*(?:text\s*=\s*)?"[^"$]{3,}"'),
         skip_path=PREVIEW_OR_TEST),
    Rule('A006', 'medium', 'Fixed height on a text-bearing component', 'Use heightIn(min = ...) so text can grow at 200%.',
         D + '03-system/typography.md', ('.kt',),
         re.compile(r'(?:Text|Button|TextField|Chip)\s*\(.*\.height\(\d+\.dp\)')),
    Rule('X003', 'high', 'ImageButton without contentDescription', 'Add android:contentDescription (or mark decorative).',
         D + '07-accessibility/accessibility.md', XML,
         finder=_element_finder('ImageButton', lambda el: 'contentDescription' not in el)),
    Rule('X004', 'low', 'Literal android:text in layout', 'Use @string resources.', D + '05-components/content-and-copy.md', XML,
         re.compile(r'android:text="(?![@?])[^"]{3,}"'), skip_path=PREVIEW_OR_TEST),
    Rule('X005', 'medium', 'Button/ImageButton under 48dp', 'Use minWidth/minHeight 48dp or padding to enlarge the touch area.',
         D + '07-accessibility/accessibility.md', XML,
         finder=_element_finder(r'(?:ImageButton|Button|com\.google\.android\.material\.button\.MaterialButton)', _small_xml_target)),
    # Layout, insets, adaptive
    Rule('L001', 'high', 'Scaffold content ignores innerPadding', 'Pass innerPadding to the content (contentPadding/padding).',
         D + '04-layout/edge-to-edge-insets.md', ('.kt',),
         finder=_window_finder(re.compile(r'\bScaffold\s*[({]'), re.compile(r'\{\s*_\s*->'), 40)),
    Rule('L002', 'medium', 'System bar color set (ignored on Android 15+)', 'Draw behind bars; use enableEdgeToEdge(SystemBarStyle).',
         D + '04-layout/edge-to-edge-insets.md', KT + XML,
         re.compile(r'(?:\b(?:statusBarColor|navigationBarColor)\s*=|set(?:Status|Navigation)BarColor\(|android:(?:statusBarColor|navigationBarColor))')),
    Rule('L003', 'high', 'Edge-to-edge opt-out (disabled at targetSdk 36)', 'Remove it and handle insets.',
         D + '04-layout/edge-to-edge-insets.md', KT + XML, re.compile(r'windowOptOutEdgeToEdgeEnforcement')),
    Rule('L004', 'medium', 'Locked orientation (ignored on large screens at SDK 36+)', 'Support all orientations; adapt layouts.',
         D + '04-layout/adaptive.md', KT + XML,
         re.compile(r'(?:android:screenOrientation="(?:portrait|landscape|sensorPortrait|sensorLandscape|reversePortrait|reverseLandscape|userPortrait|userLandscape|nosensor|locked)"|\brequestedOrientation\s*=)')),
    Rule('L005', 'medium', 'resizeableActivity="false" (ignored on large screens at SDK 36+)', 'Support resizing and multi-window.',
         D + '04-layout/adaptive.md', XML, re.compile(r'android:resizeableActivity="false"')),
    Rule('L006', 'low', 'Fixed wide width', 'Use fillMaxWidth with widthIn(max=...) or window size classes.',
         D + '04-layout/adaptive.md', ('.kt',), re.compile(r'\.(?:width|requiredWidth)\((\d{3,})\.dp\)'), check=lambda m: _num(m) >= 320),
    Rule('L007', 'medium', 'Deprecated Accompanist system UI / insets', 'Use enableEdgeToEdge and foundation WindowInsets.',
         D + '04-layout/edge-to-edge-insets.md', KT + ('.kts', '.toml'),
         re.compile(r'(?:com\.google\.accompanist[.:](?:accompanist-)?(?:systemuicontroller|insets)|rememberSystemUiController)')),
    Rule('L008', 'low', 'adjustPan soft input mode', 'Prefer adjustResize with IME insets so content is not pushed off-screen.',
         D + '04-layout/edge-to-edge-insets.md', XML, re.compile(r'windowSoftInputMode="[^"]*adjustPan')),
    # Navigation / back
    Rule('N001', 'high', 'onBackPressed() override (not called at targetSdk 36)', 'Use OnBackPressedCallback, BackHandler or NavigationEvent.',
         D + '05-components/navigation-patterns.md', KT, re.compile(r'(?:override\s+fun|public\s+void)\s+onBackPressed\s*\(')),
    Rule('N002', 'medium', 'KEYCODE_BACK interception (not dispatched at targetSdk 36)', 'Use the back callback APIs.',
         D + '05-components/navigation-patterns.md', KT, re.compile(r'\bKEYCODE_BACK\b')),
    Rule('N004', 'medium', 'Predictive back opted out', 'Temporary escape hatch only; migrate back handling.',
         D + '05-components/navigation-patterns.md', XML, re.compile(r'enableOnBackInvokedCallback="false"')),
    # Performance / motion
    Rule('P001', 'medium', 'Lazy items without a stable key', 'items(list, key = { it.id }) keeps state and enables animateItem().',
         D + '08-performance/performance.md', ('.kt',), re.compile(r'\bitems(?:Indexed)?\(\s*[A-Za-z_][\w.]*\s*\)\s*\{')),
    Rule('P002', 'medium', 'collectAsState() on Android', 'Use collectAsStateWithLifecycle().', D + '08-performance/performance.md',
         ('.kt',), re.compile(r'\.collectAsState\(')),
    Rule('P003', 'low', 'Infinite animation', 'Animate with purpose; stop on reduced motion and off-screen.',
         D + '06-motion/motion-system.md', ('.kt',), re.compile(r'\brememberInfiniteTransition\(')),
    Rule('P004', 'low', 'Blur effect', 'Costly and API 31+ only; prefer solid tonal surfaces or scrims.',
         D + '06-motion/motion-system.md', ('.kt',), re.compile(r'\.blur\(')),
    Rule('P005', 'medium', 'Long tween (>= 500 ms)', 'Use MotionScheme springs; long tweens feel sluggish.',
         D + '06-motion/motion-system.md', ('.kt',), re.compile(r'\btween\(\s*(?:durationMillis\s*=\s*)?(\d+)'),
         check=lambda m: _num(m) >= 500),
    # System
    Rule('M001', 'medium', 'Material 2 Compose import', 'Use androidx.compose.material3; mixing systems breaks consistency.',
         D + '03-system/tokens-and-theming.md', ('.kt',), re.compile(r'^\s*import\s+androidx\.compose\.material\.(?!icons\b)')),
]
RULES_BY_ID = {r.id: r for r in RULES}


def _suppressed(lines: list[str], index: int, rule_id: str) -> bool:
    previous = lines[index - 1] if index > 0 else ''
    # Same-line trailing comment, or a comment-only line directly above.
    candidates = [lines[index]] + ([previous] if previous.lstrip().startswith(('//', '<!--')) else [])
    for candidate in candidates:
        m = SUPPRESS.search(candidate)
        if m and (not m.group(1) or rule_id in re.split(r'\s*,\s*', m.group(1))):
            return True
    return False


def lint_text(text: str, rel: str, suffix: str) -> list[Finding]:
    lines = text.splitlines()
    findings: list[Finding] = []
    for rule in RULES:
        if suffix not in rule.exts or (rule.skip_path and rule.skip_path.search(rel)):
            continue
        hit_lines: list[int] = []
        if rule.finder:
            hit_lines = rule.finder(lines, rel)
        else:
            for i, line in enumerate(lines):
                stripped = line.lstrip()
                if stripped.startswith(('//', '*', '/*')):
                    continue
                m = rule.pattern.search(line)
                if m and (rule.check is None or rule.check(m)):
                    hit_lines.append(i + 1)
        for n in hit_lines:
            if not _suppressed(lines, n - 1, rule.id):
                findings.append(Finding(rule.id, rule.severity, rel, n, rule.title, rule.fix, rule.doc,
                                        lines[n - 1].strip()[:160]))
    return findings


def lint(root: Path, min_severity: str = 'low') -> dict:
    if not root.is_dir():
        raise ValueError(f'Folder not found: {root}')
    files = 0
    findings: list[Finding] = []
    for path in project_files(root, SOURCE_EXTENSIONS | {'.kts', '.toml'}):
        files += 1
        rel = path.relative_to(root).as_posix()
        findings.extend(lint_text(read_text(path), rel, path.suffix.lower()))
    floor = SEVERITY_ORDER[min_severity]
    findings = [f for f in findings if SEVERITY_ORDER[f.severity] >= floor]
    findings.sort(key=lambda f: (-SEVERITY_ORDER[f.severity], f.rule, f.file, f.line))
    counts = {s: sum(1 for f in findings if f.severity == s) for s in SEVERITY_ORDER}
    return {'root': str(root), 'files_scanned': files, 'counts': counts,
            'findings': [f.__dict__ for f in findings],
            'disclaimer': 'Heuristic leads, not proven defects. A clean run is not a quality pass; render and test the UI.'}


def lint_markdown(report: dict, max_per_rule: int = 5) -> str:
    c = report['counts']
    out = ['# Android Premium Craft - lint', '',
           f"Scanned **{report['files_scanned']}** files in `{report['root']}`: "
           f"**{c['high']} high**, {c['medium']} medium, {c['low']} low.", '']
    if not report['findings']:
        out.append('No rule matched. This does **not** mean the UI passes review.')
    shown: dict[str, int] = {}
    current = None
    for f in report['findings']:
        if f['rule'] != current:
            current = f['rule']
            total = sum(1 for x in report['findings'] if x['rule'] == current)
            out += ['', f"## {f['rule']} [{f['severity']}] {f['title']} ({total})", f"Fix: {f['fix']}  Read: `{f['doc']}`"]
        shown[current] = shown.get(current, 0) + 1
        if shown[current] <= max_per_rule:
            out.append(f"- `{f['file']}:{f['line']}` `{f['snippet']}`")
        elif shown[current] == max_per_rule + 1:
            out.append('- ... more in --format json')
    out += ['', '> ' + report['disclaimer']]
    return '\n'.join(out)


def lint_sarif(report: dict) -> dict:
    level = {'high': 'error', 'medium': 'warning', 'low': 'note'}
    return {
        '$schema': 'https://json.schemastore.org/sarif-2.1.0.json', 'version': '2.1.0',
        'runs': [{
            'tool': {'driver': {'name': 'android-premium-craft', 'informationUri': 'https://github.com/playertwo1/android-premium-craft',
                                'rules': [{'id': r.id, 'shortDescription': {'text': r.title},
                                           'help': {'text': f'{r.fix} See {r.doc}'},
                                           'defaultConfiguration': {'level': level[r.severity]}} for r in RULES]}},
            'results': [{'ruleId': f['rule'], 'level': level[f['severity']],
                         'message': {'text': f"{f['title']}. {f['fix']}"},
                         'locations': [{'physicalLocation': {'artifactLocation': {'uri': f['file']},
                                                             'region': {'startLine': f['line']}}}]}
                        for f in report['findings']],
        }],
    }


# ----------------------------------------------------------------------------- palette

TEXT_PAIRS_EXTRA = [  # (foreground role, background role, minimum ratio)
    ('onSurfaceVariant', 'surface', 4.5), ('onSurface', 'surfaceContainerHighest', 4.5),
    ('onSurfaceVariant', 'surfaceContainerHighest', 4.5), ('inverseOnSurface', 'inverseSurface', 4.5),
    ('primary', 'surface', 4.5), ('error', 'surface', 4.5), ('outline', 'surface', 3.0),
]
COLOR_DEF = re.compile(r'\bval\s+(\w+)\s*(?::\s*Color\s*)?=\s*Color\(\s*0x([0-9A-Fa-f]{8})\s*\)')
SCHEME_CALL = re.compile(r'(?:val\s+(\w+)\s*(?::\s*\w+\s*)?=\s*)?\b(lightColorScheme|darkColorScheme|[A-Z]\w*Colors)\s*\(')
ARG = re.compile(r'\b(\w+)\s*=\s*(Color\(\s*0x([0-9A-Fa-f]{8})\s*\)|[A-Za-z_]\w*)')


def _balanced(text: str, start: int) -> str:
    depth = 0
    for i in range(start, len(text)):
        if text[i] == '(':
            depth += 1
        elif text[i] == ')':
            depth -= 1
            if depth == 0:
                return text[start + 1:i]
    return text[start + 1:]


def palette(root: Path) -> dict:
    if not root.is_dir():
        raise ValueError(f'Folder not found: {root}')
    texts = {p.relative_to(root).as_posix(): read_text(p) for p in project_files(root, {'.kt'})}
    named = {m.group(1): m.group(2) for t in texts.values() for m in COLOR_DEF.finditer(t)}
    schemes = []
    for rel, text in texts.items():
        for m in SCHEME_CALL.finditer(text):
            body = _balanced(text, m.end() - 1)
            roles = {}
            for a in ARG.finditer(body):
                hexval = a.group(3) or named.get(a.group(2))
                if hexval:
                    roles[a.group(1)] = '#' + hexval.upper()
            if len(roles) >= 2:
                schemes.append({'name': m.group(1) or m.group(2), 'file': rel,
                                'line': text.count('\n', 0, m.start()) + 1, 'roles': roles})
    for s in schemes:
        roles, checks = s['roles'], []
        pairs = [(k, k[2].lower() + k[3:], 4.5) for k in roles if re.fullmatch(r'on[A-Z]\w*', k)]
        pairs += [p for p in TEXT_PAIRS_EXTRA if p not in pairs]
        for fg, bg, minimum in pairs:
            if fg in roles and bg in roles:
                try:
                    ratio = contrast_ratio(roles[fg], roles[bg])
                except ValueError:
                    continue
                checks.append({'fg': fg, 'bg': bg, 'ratio': round(ratio, 2), 'min': minimum, 'pass': ratio >= minimum})
        s['checks'] = checks
        s['failures'] = sum(1 for c in checks if not c['pass'])
    return {'root': str(root), 'schemes': schemes,
            'note': 'Static parse of Kotlin color schemes; dynamic color and runtime overlays are not covered.'}


def palette_markdown(report: dict) -> str:
    out = ['# Palette contrast', '']
    if not report['schemes']:
        out.append('No `lightColorScheme`/`darkColorScheme`/`*Colors(...)` with literal colors found. Check colors manually.')
    for s in report['schemes']:
        out += [f"## {s['name']} (`{s['file']}:{s['line']}`) - {s['failures']} failing pair(s)", '',
                '| Foreground | Background | Ratio | Min | Result |', '|---|---|---|---|---|']
        for c in s['checks']:
            out.append(f"| {c['fg']} | {c['bg']} | {c['ratio']}:1 | {c['min']} | {'pass' if c['pass'] else '**FAIL**'} |")
        out.append('')
    out.append('> ' + report['note'])
    return '\n'.join(out)


# ----------------------------------------------------------------------------- legacy inventory (v1)

def summarize(root: Path) -> dict:
    if not root.is_dir():
        raise ValueError(f'Pasta inexistente: {root}')
    stats = {'source_files': 0, 'kotlin_files': 0, 'xml_files': 0, 'java_files': 0}
    evidence: dict[str, list[str]] = {}

    def mark(kind: str, rel: str):
        samples = evidence.setdefault(kind, [])
        if len(samples) < 5 and rel not in samples:
            samples.append(rel)

    counters = {'compose_calls': 0, 'material3_references': 0, 'touch_modifiers': 0,
                'inline_colors': 0, 'small_text_literals': 0, 'lazy_lists': 0}
    patterns = {
        'edge_to_edge': re.compile(r'\b(enableEdgeToEdge|setDecorFitsSystemWindows|WindowCompat)\b'),
        'window_insets': re.compile(r'\b(WindowInsets|safeDrawingPadding|systemBarsPadding|navigationBarsPadding|imePadding|windowInsetsPadding)\b'),
        'adaptive': re.compile(r'\b(WindowSizeClass|NavigationSuiteScaffold|ListDetailPaneScaffold|calculateWindowSizeClass|currentWindowAdaptiveInfo)\b'),
        'touch_semantics': re.compile(r'\b(sizeIn|minimumInteractiveComponentSize|contentDescription|semantics|clearAndSetSemantics)\b'),
        'test_previews': re.compile(r'(@Preview|@Test|PreviewTest)\b'),
        'motion': re.compile(r'\b(AnimatedContent|AnimatedVisibility|animate\w*AsState|updateTransition|rememberInfiniteTransition)\b'),
    }
    for file in project_files(root):
        rel = file.relative_to(root).as_posix()
        stats['source_files'] += 1
        stats[{'.kt': 'kotlin_files', '.xml': 'xml_files', '.java': 'java_files'}[file.suffix.lower()]] += 1
        content = read_text(file)
        for key, pattern in patterns.items():
            if pattern.search(content):
                mark(key, rel)
        if re.search(r'@Composable\b|\bsetContent\s*\{', content):
            counters['compose_calls'] += 1
            mark('compose', rel)
        if 'material3' in content.lower():
            counters['material3_references'] += 1
            mark('material3', rel)
        counters['touch_modifiers'] += len(re.findall(r'\.clickable\s*\{|\.combinedClickable\s*\{|\.pointerInput\s*\(', content))
        inline = len(re.findall(r'\bColor\s*\(\s*0x[0-9a-fA-F]+', content))
        counters['inline_colors'] += inline
        if inline:
            mark('inline_colors', rel)
        small = len(re.findall(r'\bfontSize\s*=\s*(?:[89]|10|11)(?:\.0)?\s*\.sp\b', content))
        counters['small_text_literals'] += small
        if small:
            mark('small_text_literals', rel)
        lists = len(re.findall(r'\b(LazyColumn|LazyRow|LazyVerticalGrid|LazyHorizontalGrid)\s*(?:\(|\{)', content))
        counters['lazy_lists'] += lists
        if lists:
            mark('lazy_lists', rel)
    findings = []

    def hint(code: str, detail: str, example_key: str | None = None):
        findings.append({'code': code, 'kind': 'needs_manual_review', 'detail': detail,
                         'examples': evidence.get(example_key or code, [])})

    if stats['source_files'] == 0:
        hint('no_source', 'Nenhum Kotlin/Java/XML encontrado. Verifique se selecionou a raiz correta.')
    else:
        if 'edge_to_edge' not in evidence:
            hint('edge_to_edge', 'Nenhuma referência óbvia a edge-to-edge nos arquivos lidos.')
        if 'window_insets' not in evidence:
            hint('window_insets', 'Não foi localizada uma referência direta a insets. Verificar teclado e barras do sistema.')
        if 'adaptive' not in evidence:
            hint('adaptive', 'Não foram detectadas classes adaptáveis conhecidas. Verificar rotação e tamanhos de janela.')
        if counters['inline_colors'] >= 4:
            hint('inline_colors', f'{counters["inline_colors"]} cores literais Kotlin encontradas; investigar tokens.')
        if counters['small_text_literals']:
            hint('small_text_literals', f'{counters["small_text_literals"]} textos literais de 8-11sp detectados.')
        if counters['lazy_lists']:
            hint('lazy_lists', f'{counters["lazy_lists"]} listas lazy encontradas; conferir chaves estáveis e scroll.')
    return {'project': str(root), 'summary': stats, 'counters': counters, 'evidence': evidence, 'findings': findings,
            'disclaimer': 'Inventário textual heurístico; não prova falha nem qualidade visual. Prefira o comando lint.'}


def as_markdown(result: dict) -> str:
    s = result['summary']
    lines = ['# Inventário estático (legado v1)', '', f"Projeto: `{result['project']}`", '',
             f"Arquivos lidos: **{s['source_files']}** (Kotlin {s['kotlin_files']}, XML {s['xml_files']}, Java {s['java_files']})",
             '', '## Itens para investigar', '']
    if not result['findings']:
        lines.append('Nenhum gatilho heurístico encontrado. Isso **não** significa que a UI passou na auditoria.')
    for f in result['findings']:
        lines.append(f"- **{f['code']}**: {f['detail']}")
        if f['examples']:
            lines.append('  - Exemplos: ' + ', '.join('`' + x + '`' for x in f['examples']))
    lines += ['', '## Limites', result['disclaimer']]
    return '\n'.join(lines)


# ----------------------------------------------------------------------------- CLI

def main(argv=None) -> int:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')  # Windows consoles default to cp1252 and crash on emoji snippets
    parser = argparse.ArgumentParser(description='Android Premium Craft UI audit (read-only)')
    sub = parser.add_subparsers(dest='command', required=True)
    p_lint = sub.add_parser('lint', help='Run craft lint rules')
    p_lint.add_argument('path', type=Path)
    p_lint.add_argument('--format', choices=['markdown', 'json', 'sarif'], default='markdown')
    p_lint.add_argument('--min-severity', choices=list(SEVERITY_ORDER), default='low')
    p_lint.add_argument('--fail-on', choices=list(SEVERITY_ORDER) + ['none'], default='none')
    p_lint.add_argument('--max-per-rule', type=int, default=5)
    p_pal = sub.add_parser('palette', help='Check theme role pairs for WCAG contrast')
    p_pal.add_argument('path', type=Path)
    p_pal.add_argument('--format', choices=['markdown', 'json'], default='markdown')
    p_con = sub.add_parser('contrast', help='Contrast of two colors (foreground may have alpha)')
    p_con.add_argument('foreground')
    p_con.add_argument('background')
    sub.add_parser('rules', help='List lint rules')
    p_scan = sub.add_parser('scan', help='Legacy v1 inventory')
    p_scan.add_argument('path', type=Path)
    p_scan.add_argument('--format', choices=['markdown', 'json'], default='markdown')
    args = parser.parse_args(argv)
    try:
        if args.command == 'contrast':
            ratio = contrast_ratio(args.foreground, args.background)
            print(f'Contrast: {ratio:.2f}:1 | AA body text >=4.5: {"PASS" if ratio >= 4.5 else "FAIL"} | '
                  f'large text / UI graphics >=3: {"PASS" if ratio >= 3 else "FAIL"}')
        elif args.command == 'rules':
            for r in RULES:
                print(f'{r.id}  {r.severity:<6}  {r.title}  ->  {r.doc}')
            print(f'{len(RULES)} rules')
        elif args.command == 'lint':
            report = lint(args.path.resolve(), args.min_severity)
            if args.format == 'json':
                print(json.dumps(report, ensure_ascii=False, indent=2))
            elif args.format == 'sarif':
                print(json.dumps(lint_sarif(report), indent=2))
            else:
                print(lint_markdown(report, args.max_per_rule))
            if args.fail_on != 'none':
                floor = SEVERITY_ORDER[args.fail_on]
                if any(SEVERITY_ORDER[f['severity']] >= floor for f in report['findings']):
                    return 1
        elif args.command == 'palette':
            report = palette(args.path.resolve())
            print(json.dumps(report, ensure_ascii=False, indent=2) if args.format == 'json' else palette_markdown(report))
        else:
            result = summarize(args.path.resolve())
            print(json.dumps(result, ensure_ascii=False, indent=2) if args.format == 'json' else as_markdown(result))
    except ValueError as exc:
        print(f'Error: {exc}', file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

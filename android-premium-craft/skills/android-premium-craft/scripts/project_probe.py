#!/usr/bin/env python3
"""Read-only Android project recon: versions, toolkit, manifest flags and platform mandates.

Regex only: does not run Gradle, resolve plugins or download anything. `unknown` is a valid answer.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

MAX_BYTES = 1_000_000  # bigger files are not hand-written build config
MAX_SCAN = 4000  # cap for source counting in large monorepos
SKIP_DIRS = {'.git', '.gradle', '.idea', 'build', 'node_modules', '.cxx', 'out'}
BUILD_FILES = ('build.gradle.kts', 'build.gradle', 'app/build.gradle.kts', 'app/build.gradle',
               'gradle/libs.versions.toml', 'gradle/wrapper/gradle-wrapper.properties')


def _walk(root: Path, pattern: str, limit: int):
    count = 0
    for path in root.rglob(pattern):
        if any(part in SKIP_DIRS for part in path.relative_to(root).parts):
            continue
        count += 1
        if count > limit:
            return
        yield path


def _read(path: Path) -> str:
    try:
        if path.is_file() and path.stat().st_size <= MAX_BYTES:
            return path.read_text(encoding='utf-8', errors='replace')
    except OSError:
        pass
    return ''


def read_config_files(root: Path) -> dict[str, str]:
    if not root.is_dir():
        raise ValueError(f'Project not found: {root}')
    output = {}
    for rel in BUILD_FILES:
        text = _read(root / rel)
        if text:
            output[rel] = text
    for path in _walk(root, 'build.gradle*', 60):  # feature/core modules
        rel = path.relative_to(root).as_posix()
        if rel not in output:
            text = _read(path)
            if text:
                output[rel] = text
    return output


def get_candidates(configs: dict[str, str]) -> list[dict[str, str]]:
    result = []
    expressions = [
        (r'com\.android\.tools\.build:gradle:([\w.\-]+)', 'gradle-plugin-classpath'),
        (r'id\s*\(\s*["\']com\.android\.(?:application|library)["\']\s*\)\s*version\s*["\']([\w.\-]+)', 'plugin-version'),
        (r'id\s+["\']com\.android\.(?:application|library)["\']\s+version\s+["\']([\w.\-]+)', 'plugin-version'),
        (r'(?m)^\s*(?:agp|androidGradlePlugin|android-gradle-plugin)\s*=\s*["\']([\w.\-]+)', 'version-catalog-agp-candidate'),
    ]
    for rel, content in configs.items():
        for regex, kind in expressions:
            for match in re.finditer(regex, content):
                entry = {'version': match.group(1), 'file': rel, 'origin': kind}
                if entry not in result:
                    result.append(entry)
    return result


def parse_version(value: str) -> tuple[int, int, int, int] | None:
    match = re.match(r'^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)(\d+))?', value, re.I)
    if not match:
        return None
    maj, minor, patch, pre, num = match.groups()
    rank = {'alpha': -3, 'beta': -2, 'rc': -1, None: 0}[pre.lower() if pre else None]
    return int(maj), int(minor), int(patch), rank * 10000 + (int(num) if num else 0)


def screenshot_recommendation(candidates: list[dict]) -> str:
    parsed = [v for v in (parse_version(e['version']) for e in candidates) if v is not None]
    if len(set(parsed)) > 1:
        return 'multiple_agp_candidates_verify_manually'
    if not parsed:
        return 'unknown_agp_check_manually'
    if parsed[0] >= parse_version('9.5.0-alpha03'):
        return 'agp_test_suites_candidate_experimental_verify_toolchain'
    return 'prefer_existing_screenshots_or_manual_or_roborazzi_no_forced_agp_upgrade'


def _catalog_value(catalog: str, *keys: str) -> str | None:
    for key in keys:
        m = re.search(r'(?m)^\s*' + re.escape(key) + r'\s*=\s*["\']([^"\']+)["\']', catalog)
        if m:
            return m.group(1)
    return None


def _first_int(text: str, *names: str) -> list[int]:
    found = []
    for name in names:
        for m in re.finditer(r'\b' + name + r'\s*(?:=|\()?\s*["\']?(\d{2})\b', text):
            found.append(int(m.group(1)))
    return found


def versions(configs: dict[str, str]) -> dict:
    allt = '\n'.join(configs.values())
    catalog = configs.get('gradle/libs.versions.toml', '')
    sdk = {}
    for label, names, keys in (('compileSdk', ('compileSdk', 'compileSdkVersion'), ('compileSdk', 'compile-sdk')),
                               ('targetSdk', ('targetSdk', 'targetSdkVersion'), ('targetSdk', 'target-sdk')),
                               ('minSdk', ('minSdk', 'minSdkVersion'), ('minSdk', 'min-sdk'))):
        values = _first_int(allt, *names)
        cat = _catalog_value(catalog, *keys)
        if cat and cat.isdigit():
            values.append(int(cat))
        sdk[label] = sorted(set(values)) or 'unknown'
    bom = re.search(r'compose-bom:([\d.]+(?:-[\w]+)?)', allt)
    m3 = re.search(r'material3(?:-android)?:([\d.]+(?:-[\w]+)?)', allt)
    return {
        **sdk,
        'compose_bom': (bom.group(1) if bom else _catalog_value(catalog, 'composeBom', 'compose-bom', 'androidx-compose-bom')) or 'unknown',
        'material3': (m3.group(1) if m3 else _catalog_value(catalog, 'material3', 'composeMaterial3', 'compose-material3', 'androidx-material3')) or 'unknown (often via BOM)',
        'kotlin': _catalog_value(catalog, 'kotlin', 'kotlinVersion') or (
            (re.search(r'org\.jetbrains\.kotlin\.\w+["\']\)?\s*version\s*["\']([\w.\-]+)', allt) or [None, None])[1]) or 'unknown',
    }


LIBS = {
    'navigation3': r'navigation3',
    'navigation_compose': r'navigation-compose',
    'material3_adaptive': r'material3-adaptive|adaptive-navigation-suite',
    'roborazzi': r'roborazzi',
    'paparazzi': r'paparazzi',
    'compose_preview_screenshot': r'com\.android\.compose\.screenshot|screenshotTest',
    'dropshots': r'dropshots',
    'compose_ui_test': r'ui-test-junit4',
    'espresso': r'espresso-core',
    'robolectric': r'robolectric',
    'macrobenchmark': r'benchmark-macro',
    'baseline_profile': r'baselineprofile|profileinstaller',
    'coil': r'io\.coil-kt',
    'accompanist_legacy_ui': r'accompanist-(?:systemuicontroller|insets)',
}


def manifest_flags(root: Path) -> dict:
    flags: dict[str, list] = {'screenOrientation': [], 'resizeableActivity_false': [], 'enableOnBackInvokedCallback': [],
                              'windowSoftInputMode': [], 'edge_to_edge_opt_out': []}
    for path in _walk(root, 'AndroidManifest.xml', 40):
        rel, text = path.relative_to(root).as_posix(), _read(path)
        flags['screenOrientation'] += [f'{rel}: {v}' for v in re.findall(r'screenOrientation="(\w+)"', text)]
        if 'resizeableActivity="false"' in text:
            flags['resizeableActivity_false'].append(rel)
        flags['enableOnBackInvokedCallback'] += [f'{rel}: {v}' for v in re.findall(r'enableOnBackInvokedCallback="(\w+)"', text)]
        flags['windowSoftInputMode'] += [f'{rel}: {v}' for v in re.findall(r'windowSoftInputMode="([^"]+)"', text)]
    for path in _walk(root, '*.xml', 400):
        if 'values' in path.parent.name and 'windowOptOutEdgeToEdgeEnforcement' in _read(path):
            flags['edge_to_edge_opt_out'].append(path.relative_to(root).as_posix())
    return flags


def toolkit(root: Path) -> dict:
    composables = layouts = 0
    for path in _walk(root, '*.kt', MAX_SCAN):
        if '@Composable' in _read(path):
            composables += 1
    for path in _walk(root, '*.xml', MAX_SCAN):
        if path.parent.name.startswith('layout'):
            layouts += 1
    verdict = 'unknown'
    if composables and layouts:
        verdict = 'hybrid'
    elif composables:
        verdict = 'compose'
    elif layouts:
        verdict = 'views'
    return {'verdict': verdict, 'files_with_composables': composables, 'xml_layouts': layouts}


def mandates(target: list[int] | str) -> list[str]:
    if not isinstance(target, list) or not target:
        return ['targetSdk unknown: check it before planning (edge-to-edge, predictive back, large-screen rules depend on it).']
    t = max(target)
    out = []
    if t >= 35:
        out.append('SDK 35+: edge-to-edge enforced on Android 15+; status/navigation bar colors ignored.')
    if t >= 36:
        out.append('SDK 36+: edge-to-edge opt-out disabled; predictive back animations on; onBackPressed() not called; '
                   'large screens ignore orientation/resizability locks (opt-out still possible at 36).')
    if t >= 37:
        out.append('SDK 37+: large-screen orientation/resizability opt-out removed; adaptive layouts are mandatory.')
    if t < 35:
        out.append(f'SDK {t}: below current Play target requirements; plan for 35/36 behavior now.')
    return out


def probe(root: Path) -> dict:
    files = read_config_files(root)
    candidates = get_candidates(files)
    all_text = '\n'.join(files.values())
    screenshot = bool(re.search(r'com\.android\.compose\.screenshot|roborazzi|paparazzi|screenshotTest|dropshots', all_text, re.I))
    ver = versions(files)
    return {
        'root': str(root), 'examined_files': list(files.keys()),
        'agp_version_candidates': candidates,
        'versions': ver,
        'libraries': {k: bool(re.search(v, all_text, re.I)) for k, v in LIBS.items()},
        'maestro_flows': (root / '.maestro').is_dir(),
        'toolkit': toolkit(root),
        'manifest': manifest_flags(root),
        'mandates': mandates(ver['targetSdk']),
        'screenshot_config_keywords_found': screenshot,
        'screenshot_advice': screenshot_recommendation(candidates),
        'limits': 'Static approximate scan. Catalog aliases, convention plugins, included builds and CI can hide real versions. '
                  'No build, emulator or screenshot run.',
    }


def markdown(result: dict) -> str:
    v, t = result['versions'], result['toolkit']
    lines = ['# Android project probe - report only', '', f"Root: `{result['root']}`", '',
             f"**Toolkit:** {t['verdict']} ({t['files_with_composables']} Kotlin files with composables, {t['xml_layouts']} XML layouts)",
             f"**SDK:** compile {v['compileSdk']} | target {v['targetSdk']} | min {v['minSdk']}",
             f"**Compose BOM:** {v['compose_bom']} | **Material 3:** {v['material3']} | **Kotlin:** {v['kotlin']}", '',
             '## AGP version candidates', '']
    for item in result['agp_version_candidates']:
        lines.append(f"- `{item['version']}` in `{item['file']}` ({item['origin']})")
    if not result['agp_version_candidates']:
        lines.append('- Unknown: inspect plugin resolution / version catalogs manually.')
    lines += ['', '## Platform mandates', ''] + [f'- {m}' for m in result['mandates']]
    lines += ['', '## Libraries detected', '',
              ', '.join(k for k, on in result['libraries'].items() if on) or 'none of the tracked libraries',
              f"Maestro flows: {'yes' if result['maestro_flows'] else 'no'}", '', '## Manifest flags', '']
    for key, values in result['manifest'].items():
        if values:
            lines.append(f'- {key}: ' + '; '.join(values))
    lines += ['', f"Screenshot config found: **{result['screenshot_config_keywords_found']}** | advice: `{result['screenshot_advice']}`",
              '', f"Limits: {result['limits']}"]
    return '\n'.join(lines)


def main(argv=None) -> int:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')  # Windows consoles default to cp1252
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('project', type=Path)
    parser.add_argument('--format', choices=('markdown', 'json'), default='markdown')
    args = parser.parse_args(argv)
    try:
        report = probe(args.project.resolve())
    except (ValueError, OSError) as exc:
        parser.error(str(exc))
    print(json.dumps(report, ensure_ascii=False, indent=2) if args.format == 'json' else markdown(report))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

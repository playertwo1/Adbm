#!/usr/bin/env python3
"""Compute the Craft Score (0-100) from a critique JSON and print the scorecard.

The score is a transparent aggregation of evidence-backed rubric judgments, not a
measurement. Weights, caps and confidence rules are fixed here so two runs on the same
judgments always give the same number.

  critique_score.py critique.json                    scorecard (Markdown)
  critique_score.py critique.json --format json      scored JSON
  critique_score.py critique.json --save .craft/critique   archive + trend
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

# Weights sum to 100. Hierarchy weighs most: it decides whether the job is done at a glance
# (the property the CHI '26 expressive-design study measured). Accessibility is next because
# a failure excludes users entirely. The rest split evenly by user impact.
WEIGHTS = {
    'hierarchy': 14, 'layout': 10, 'typography': 10, 'color': 8, 'consistency': 10,
    'states': 10, 'touch': 10, 'accessibility': 12, 'platform': 8, 'motion': 8,
}
LABELS = {
    'hierarchy': 'Hierarchy', 'layout': 'Layout and rhythm', 'typography': 'Typography', 'color': 'Color',
    'consistency': 'System consistency', 'states': 'States', 'touch': 'Touch and ergonomics',
    'accessibility': 'Accessibility', 'platform': 'Platform fit', 'motion': 'Motion and performance',
}
# Caps: a beautiful screen that blocks a task is not "polished". Any open P0 caps the app below
# the Rough band; P1s cap below Polished so the grade never hides a release blocker.
CAP_P0 = 49
CAP_MULTI_P1 = 74
CAP_ONE_P1 = 84
BANDS = [(90, 'S', 'Premium'), (80, 'A', 'Polished'), (70, 'B', 'Solid'), (55, 'C', 'Generic'), (40, 'D', 'Rough'), (0, 'E', 'Broken')]
IMPORTANCE = {'primary': 2, 'secondary': 1}  # primary journeys count double in the app score
MIN_EVIDENCE = 12
BASIS = {'visual', 'code', 'both', 'measured'}


def band(score: float) -> tuple[str, str]:
    for floor, letter, name in BANDS:
        if score >= floor:
            return letter, name
    return BANDS[-1][1:]


def _validate(data: dict) -> list[str]:
    errors = []
    if not isinstance(data, dict):
        return ['Expected a JSON object']
    for key in ('app', 'method'):
        if not isinstance(data.get(key), str) or not data[key].strip():
            errors.append(f'{key} must be nonempty text')
    screens = data.get('screens')
    if not isinstance(screens, list) or not screens:
        return errors + ['screens must be a nonempty list']
    for i, s in enumerate(screens):
        where = f"screens[{i}] ({s.get('name', '?') if isinstance(s, dict) else '?'})"
        if not isinstance(s, dict) or not s.get('name'):
            errors.append(f'{where}: needs a name')
            continue
        if s.get('importance', 'secondary') not in IMPORTANCE:
            errors.append(f'{where}: importance must be primary or secondary')
        scores = s.get('scores')
        if not isinstance(scores, dict):
            errors.append(f'{where}: scores must be an object')
            continue
        for dim in WEIGHTS:
            item = scores.get(dim)
            if not isinstance(item, dict):
                errors.append(f'{where}.{dim}: missing (use "score": "n/a" with a reason if it does not apply)')
                continue
            value = item.get('score')
            if value != 'n/a' and not (isinstance(value, int) and 0 <= value <= 4):
                errors.append(f'{where}.{dim}: score must be an integer 0-4 or "n/a"')
            if not isinstance(item.get('evidence'), str) or len(item['evidence'].strip()) < MIN_EVIDENCE:
                errors.append(f'{where}.{dim}: evidence must point to a screenshot, file:line or measurement')
            if value != 'n/a' and item.get('basis') not in BASIS:
                errors.append(f'{where}.{dim}: basis must be one of ' + '/'.join(sorted(BASIS)))
        unknown = set(scores) - set(WEIGHTS)
        if unknown:
            errors.append(f'{where}: unknown dimensions {sorted(unknown)}')
    for i, f in enumerate(data.get('findings', [])):
        if not isinstance(f, dict) or f.get('severity') not in ('P0', 'P1', 'P2', 'P3') or not f.get('title'):
            errors.append(f'findings[{i}] needs severity P0-P3 and a title')
    return errors


def score_screen(screen: dict) -> dict:
    earned = possible = visual_weight = 0.0
    dims = {}
    for dim, weight in WEIGHTS.items():
        item = screen['scores'][dim]
        if item['score'] == 'n/a':
            dims[dim] = None
            continue
        earned += item['score'] / 4 * weight
        possible += weight
        if item.get('basis') in ('visual', 'both', 'measured'):
            visual_weight += weight
        dims[dim] = item['score']
    raw = 100 * earned / possible if possible else 0.0
    return {'name': screen['name'], 'importance': screen.get('importance', 'secondary'), 'raw': round(raw, 1),
            'dimensions': dims, 'visual_coverage': round(100 * visual_weight / possible) if possible else 0}


def analyze(data: dict) -> dict:
    errors = _validate(data)
    if errors:
        return {'valid': False, 'errors': errors}
    screens = [score_screen(s) for s in data['screens']]
    total_w = sum(IMPORTANCE[s['importance']] for s in screens)
    raw = sum(s['raw'] * IMPORTANCE[s['importance']] for s in screens) / total_w
    coverage = sum(s['visual_coverage'] * IMPORTANCE[s['importance']] for s in screens) / total_w
    findings = data.get('findings', [])
    counts = {p: sum(1 for f in findings if f['severity'] == p) for p in ('P0', 'P1', 'P2', 'P3')}
    cap, cap_reason = 100, None
    if counts['P0']:
        cap, cap_reason = CAP_P0, f"{counts['P0']} open P0"
    elif counts['P1'] >= 2:
        cap, cap_reason = CAP_MULTI_P1, f"{counts['P1']} open P1"
    elif counts['P1'] == 1:
        cap, cap_reason = CAP_ONE_P1, '1 open P1'
    if cap >= raw:  # the cap only matters when it actually lowers the score
        cap, cap_reason = 100, None
    final = round(min(raw, cap))
    letter, name = band(final)
    confidence = 'high' if coverage >= 80 else 'medium' if coverage >= 40 else 'low'
    per_dim = {}
    for dim in WEIGHTS:
        vals = [(s['dimensions'][dim], IMPORTANCE[s['importance']]) for s in screens if s['dimensions'][dim] is not None]
        per_dim[dim] = round(sum(v * w for v, w in vals) / sum(w for _, w in vals), 1) if vals else None
    return {
        'valid': True, 'app': data['app'], 'date': data.get('date') or date.today().isoformat(), 'method': data['method'],
        'score': final, 'raw_score': round(raw, 1), 'grade': letter, 'band': name,
        'cap': cap if cap_reason else None, 'cap_reason': cap_reason,
        'confidence': confidence, 'visual_coverage': round(coverage),
        'dimensions': per_dim, 'screens': screens, 'finding_counts': counts,
        'note': 'Aggregated expert judgment from evidence-backed rubric scores; not a measurement.',
    }


def bar(value: float | None, width: int = 8) -> str:
    if value is None:
        return 'n/a'
    full = round(value / 4 * width)
    return '█' * full + '░' * (width - full)


def scorecard(result: dict, data: dict, trend: list[str] | None = None) -> str:
    keys = {d: next((s['scores'][d].get('key_issue') for s in data['screens'] if s['scores'][d].get('key_issue')), '') for d in WEIGHTS}
    head = f"# Craft Score: {result['score']}/100 - {result['grade']} ({result['band']})"
    lines = [head, '',
             f"App: **{result['app']}** · {result['date']} · Method: {result['method']} · "
             f"Confidence: **{result['confidence']}** ({result['visual_coverage']}% of weight judged from pixels)"]
    if result['cap_reason']:
        lines.append(f"Capped at {result['cap']} by {result['cap_reason']} (raw {result['raw_score']}). Fix those to unlock the rest.")
    lines += ['', '| Dimension | Weight | Score | | Key issue |', '|---|---|---|---|---|']
    for dim, w in WEIGHTS.items():
        v = result['dimensions'][dim]
        lines.append(f"| {LABELS[dim]} | {w} | {'n/a' if v is None else f'{v}/4'} | `{bar(v)}` | {keys[dim]} |")
    lines += ['', '| Screen | Importance | Score | Visual evidence |', '|---|---|---|---|']
    for s in result['screens']:
        lines.append(f"| {s['name']} | {s['importance']} | {s['raw']} | {s['visual_coverage']}% |")
    c = result['finding_counts']
    lines += ['', f"Findings: {c['P0']} P0 · {c['P1']} P1 · {c['P2']} P2 · {c['P3']} P3", '',
              'Bands: 90+ S Premium · 80 A Polished · 70 B Solid · 55 C Generic · 40 D Rough · <40 E Broken']
    if trend:
        lines += ['', 'Trend: ' + ' -> '.join(trend)]
    lines += ['', '> ' + result['note']]
    return '\n'.join(lines)


def save(result: dict, folder: Path) -> list[str]:
    folder.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r'[^a-z0-9]+', '-', result['app'].lower()).strip('-') or 'app'
    n = len(list(folder.glob(f"{result['date']}-{slug}-*.json")))
    # Zero-padded run number keeps same-day runs in chronological order when sorted by name.
    (folder / f"{result['date']}-{slug}-{n + 1:02d}.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
    history = []
    for path in sorted(folder.glob(f'*-{slug}*.json')):
        try:
            history.append(json.loads(path.read_text(encoding='utf-8')))
        except (OSError, json.JSONDecodeError):
            continue
    return [f"{h['score']}{h['grade']}" for h in history[-6:] if 'score' in h]


def main(argv=None) -> int:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')  # bars use block characters; Windows consoles default to cp1252
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('critique', type=Path)
    p.add_argument('--format', choices=['markdown', 'json'], default='markdown')
    p.add_argument('--save', type=Path, metavar='DIR', help='Archive the scored run (e.g. .craft/critique) and print the trend')
    a = p.parse_args(argv)
    try:
        data = json.loads(a.critique.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        p.error(str(exc))
    result = analyze(data)
    if not result['valid']:
        print('\n'.join('ERROR ' + e for e in result['errors']), file=sys.stderr)
        return 2
    trend = save(result, a.save) if a.save else None
    print(json.dumps(result, indent=2, ensure_ascii=False) if a.format == 'json' else scorecard(result, data, trend))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""Lint an Android UI evidence report (v1 or v2 schema) and derive the release decision.

A PASS in the JSON is *not* independent verification: this checks documentation only.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

CORE = ('build', 'interaction', 'visual', 'states', 'accessibility', 'navigation', 'adaptive', 'regression', 'performance')
V1_CORE = ('build', 'interaction', 'visual', 'accessibility', 'navigation', 'regression', 'performance')
ALLOWED = {'pass', 'fail', 'partial', 'not_run', 'not_applicable'}
MIN_EVIDENCE = 12  # shorter than this cannot name a command, file or result
BLOCKING = {'P0', 'P1'}


def _issues(report: dict, errors: list[str]) -> list[str]:
    """Blocking open issues. v1 `critical_open_issues` (strings) all block; v2 `open_issues` block on P0/P1."""
    blocking: list[str] = []
    legacy = report.get('critical_open_issues')
    if legacy is not None:
        if not isinstance(legacy, list):
            errors.append('critical_open_issues must be a list')
        else:
            blocking += [str(x) for x in legacy]
    issues = report.get('open_issues', [])
    if not isinstance(issues, list):
        errors.append('open_issues must be a list')
        return blocking
    for i, item in enumerate(issues):
        if isinstance(item, str):
            if item.split(' ', 1)[0].strip(':').upper() in BLOCKING:
                blocking.append(item)
        elif isinstance(item, dict):
            sev = str(item.get('severity', '')).upper()
            if sev not in {'P0', 'P1', 'P2', 'P3'}:
                errors.append(f'open_issues[{i}].severity must be P0-P3')
            elif sev in BLOCKING:
                blocking.append(f"{sev} {item.get('title', '')}".strip())
        else:
            errors.append(f'open_issues[{i}] must be a string or an object')
    return blocking


def analyze(report: dict) -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    blockers: list[str] = []
    if not isinstance(report, dict):
        return {'valid': False, 'ready': False, 'decision': 'invalid', 'errors': ['Expected JSON object'], 'blockers': []}
    for name in ('project', 'scope', 'device_context'):
        if not isinstance(report.get(name), str) or not report[name].strip():
            errors.append(f'{name} must be nonempty text')
    checks = report.get('checks')
    if not isinstance(checks, dict):
        return {'valid': False, 'ready': False, 'decision': 'invalid', 'errors': errors + ['checks must be an object'], 'blockers': []}

    required = report.get('required_checks')
    if not isinstance(required, list) or not required or any(x not in CORE for x in required) or len(required) != len(set(required)):
        errors.append('required_checks must be a nonempty unique subset of: ' + ', '.join(CORE))
        required = []
    if not isinstance(report.get('claims_of_speedup'), bool):
        errors.append('claims_of_speedup must be boolean')
    elif report['claims_of_speedup'] and 'performance' not in required:
        required = [*required, 'performance']

    v2 = str(report.get('schema', '')).endswith('@2')
    for name in CORE:
        item = checks.get(name)
        if item is None:
            if name in required or (not v2 and name in V1_CORE):
                errors.append(f'checks.{name} missing')
            else:
                warnings.append(f'checks.{name} not reported')
            continue
        if not isinstance(item, dict):
            errors.append(f'checks.{name} must be an object')
            continue
        if item.get('status') not in ALLOWED:
            errors.append(f'checks.{name}.status must be one of ' + '/'.join(sorted(ALLOWED)))
        if not isinstance(item.get('evidence'), str) or len(item['evidence'].strip()) < MIN_EVIDENCE:
            errors.append(f'checks.{name}.evidence must state the result or why it was not run (>= {MIN_EVIDENCE} chars)')
        if item.get('status') == 'not_applicable' and name in required:
            errors.append(f'checks.{name} is required but marked not_applicable')

    open_blocking = _issues(report, errors)
    if open_blocking:
        blockers.append(f'{len(open_blocking)} critical open issue(s)')
    statuses = {name: (checks.get(name) or {}).get('status') for name in required}
    for name, status in statuses.items():
        if status != 'pass':
            blockers.append(f'{name}: {status or "missing"}')

    valid = not errors
    if not valid:
        decision = 'invalid'
    elif open_blocking or any(s == 'fail' for s in statuses.values()):
        decision = 'blocked'
    elif blockers:
        build_ok = (checks.get('build') or {}).get('status') == 'pass'
        decision = 'ready_for_visual_review' if build_ok else 'incomplete'
    else:
        decision = 'verified_for_scope'
    return {'valid': valid, 'ready': decision == 'verified_for_scope', 'decision': decision,
            'errors': errors, 'warnings': warnings, 'blockers': blockers,
            'warning': 'Documentation-only gate. No app builds, UI interaction, screenshots or performance measurements are executed by this script.'}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report', type=Path)
    parser.add_argument('--require-ready', action='store_true', help='Exit 1 unless the decision is verified_for_scope')
    args = parser.parse_args(argv)
    try:
        data = json.loads(args.report.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        parser.error(str(exc))
    outcome = analyze(data)
    print(json.dumps(outcome, ensure_ascii=False, indent=2))
    if not outcome['valid']:
        return 2
    if args.require_ready and not outcome['ready']:
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

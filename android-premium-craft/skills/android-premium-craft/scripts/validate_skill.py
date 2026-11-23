#!/usr/bin/env python3
"""Self-check this skill against the Agent Skills spec and its own authoring rules.

Checks: frontmatter (name, description), SKILL.md length, every relative Markdown link
resolves, long reference files have a Contents section, JSON assets parse.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

NAME_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
LINK_RE = re.compile(r'\[[^\]]*\]\(([^)\s]+)\)')
MAX_SKILL_LINES = 500  # Agent Skills spec recommendation for the SKILL.md body
TOC_THRESHOLD = 100  # Anthropic guidance: reference files longer than this need a table of contents


def frontmatter(text: str) -> dict[str, str]:
    if not text.startswith('---\n'):
        raise ValueError('SKILL.md must start with --- frontmatter')
    end = text.find('\n---', 4)
    if end < 0:
        raise ValueError('Unterminated frontmatter')
    fields = {}
    for line in text[4:end].splitlines():
        m = re.match(r'^([A-Za-z_-]+):\s*(.*)$', line)  # top-level keys only
        if m:
            fields[m.group(1)] = m.group(2).strip().strip('"\'')
    return fields


def validate(root: Path) -> list[str]:
    errors = []
    skill = root / 'SKILL.md'
    if not skill.is_file():
        return [f'Missing {skill}']
    text = skill.read_text(encoding='utf-8')
    try:
        fm = frontmatter(text)
    except ValueError as exc:
        return [str(exc)]
    name, desc = fm.get('name', ''), fm.get('description', '')
    if not NAME_RE.fullmatch(name) or len(name) > 64:
        errors.append(f'name "{name}" must be 1-64 lowercase letters, digits and single hyphens')
    if name != root.name:
        errors.append(f'name "{name}" must match the folder name "{root.name}"')
    if not desc or len(desc) > 1024:
        errors.append(f'description must be 1-1024 characters (has {len(desc)})')
    if '<' in desc or '>' in desc:
        errors.append('description must not contain angle brackets / XML tags')
    if len(text.splitlines()) > MAX_SKILL_LINES:
        errors.append(f'SKILL.md has {len(text.splitlines())} lines (max {MAX_SKILL_LINES})')

    for md in sorted(root.rglob('*.md')):
        body = md.read_text(encoding='utf-8')
        rel = md.relative_to(root).as_posix()
        for target in LINK_RE.findall(body):
            if re.match(r'^(https?:|mailto:|#)', target):
                continue
            if '\\' in target:
                errors.append(f'{rel}: use forward slashes in link {target}')
            path = (md.parent / target.split('#')[0]).resolve()
            if not path.exists():
                errors.append(f'{rel}: broken link {target}')
        if md != skill and len(body.splitlines()) > TOC_THRESHOLD and '## Contents' not in body:
            errors.append(f'{rel}: over {TOC_THRESHOLD} lines without a "## Contents" section')

    for js in sorted(root.rglob('*.json')):
        try:
            json.loads(js.read_text(encoding='utf-8'))
        except json.JSONDecodeError as exc:
            errors.append(f'{js.relative_to(root).as_posix()}: invalid JSON ({exc})')
    return errors


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('skill_dir', nargs='?', type=Path, default=Path(__file__).resolve().parent.parent)
    a = p.parse_args(argv)
    errors = validate(a.skill_dir.resolve())
    for e in errors:
        print('ERROR', e)
    print('OK' if not errors else f'{len(errors)} problem(s)')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())

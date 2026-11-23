#!/usr/bin/env python3
"""Copy this skill into a project's agent skill folders. Never overwrites without --replace."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

NAME = 'android-premium-craft'
AGENTS = ('claude', 'codex', 'antigravity', 'gemini')
IGNORE = shutil.ignore_patterns('__pycache__', '*.pyc', '.pytest_cache')


def targets_for(project: Path, agents: list[str]) -> list[Path]:
    targets = []
    if any(agent in ('codex', 'antigravity', 'gemini') for agent in agents):
        targets.append(project / '.agents' / 'skills' / NAME)  # shared by Codex, Antigravity and Gemini CLI
    if 'claude' in agents:
        targets.append(project / '.claude' / 'skills' / NAME)
    return targets


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description='Install Android Premium Craft into a project for Claude Code, Codex, Antigravity or Gemini CLI')
    p.add_argument('--project', type=Path, required=True)
    p.add_argument('--agents', nargs='+', choices=AGENTS, required=True)
    p.add_argument('--replace', action='store_true', help='Replace an existing install (commit or back up first)')
    a = p.parse_args(argv)
    project = a.project.expanduser().resolve()
    if not project.is_dir():
        p.error('--project must exist; the installer does not create repositories')
    source = Path(__file__).resolve().parent.parent
    if not (source / 'SKILL.md').is_file():
        p.error('Could not find SKILL.md next to the bundled scripts')
    paths = targets_for(project, a.agents)
    for dst in paths:
        if dst.resolve() == source or source in dst.resolve().parents:
            p.error('Target must be outside the source folder')
    existing = [str(dst) for dst in paths if dst.exists()]
    if existing and not a.replace:
        p.error('Existing skill will not be replaced without --replace: ' + ', '.join(existing))
    for dst in paths:
        if dst.exists():
            shutil.rmtree(dst)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(source, dst, ignore=IGNORE)
        print('Installed:', dst)
    print('Tip: paste assets/AGENTS_SNIPPET.md into AGENTS.md / CLAUDE.md so the core rules apply even when the skill is not loaded.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

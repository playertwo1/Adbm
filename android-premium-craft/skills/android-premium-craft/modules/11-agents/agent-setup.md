# Agent setup

One canonical skill folder, installed where each agent looks. Do not maintain divergent copies.

## Contents
- Install paths
- Plugin marketplaces
- Always-on snippet (why and how)
- Useful tools and MCP servers
- Multi-agent use
- Evals: proving the skill helps

## Install paths

| Agent | Project scope | Personal scope | Invoke |
|---|---|---|---|
| Claude Code | `.claude/skills/android-premium-craft/` | `~/.claude/skills/android-premium-craft/` | `/android-premium-craft critique` |
| Codex (CLI/IDE) | `.agents/skills/android-premium-craft/` (scanned from cwd up to repo root) | `~/.agents/skills/` | `$android-premium-craft critique` or `/skills` |
| Antigravity CLI | `.agents/skills/android-premium-craft/` | `~/.gemini/antigravity-cli/skills/` | `/android-premium-craft` (skills become slash commands) |
| Gemini CLI (legacy) | `.agents/skills/` or `.gemini/skills/` | `~/.gemini/skills/` | ask to use the skill; `/skills list` |
| Cursor, Copilot, others | Point `AGENTS.md`/rules to `SKILL.md` | - | mention the skill |

Bundled installer (project scope, never overwrites without `--replace`):

```bash
python skills/android-premium-craft/scripts/install_skill.py --project /path/to/app --agents claude codex antigravity
```

## Plugin marketplaces

From a GitHub repository with this layout (`.claude-plugin/`, `.codex-plugin/`, `skills/android-premium-craft/`):

```text
Claude Code: /plugin marketplace add playertwo1/android-premium-craft
             /plugin install android-premium-craft@android-premium-craft
Codex:       codex plugin marketplace add playertwo1/android-premium-craft
             codex plugin add android-premium-craft@android-premium-craft
Any agent:   npx skills add playertwo1/android-premium-craft
```

## Always-on snippet (why and how)

Skills load only when the agent decides they are relevant; evaluations by Vercel (Jan 2026) found agents skipped available skills in a large share of cases, while a compact always-present index in `AGENTS.md` performed best. Combine both: keep the skill for depth and paste [AGENTS_SNIPPET.md](../../assets/AGENTS_SNIPPET.md) (about 25 lines) into the app's `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` so the non-negotiables apply even when the skill is not loaded.

## Useful tools and MCP servers

Optional; the skill works without any of them.

| Tool | Use in this skill |
|---|---|
| adb + emulator | `device_matrix.py`, screenshots, view-tree measurements |
| Maestro MCP / CLI | Reach screens, inspect hierarchy, screenshots, regression flows |
| Android CLI (`android`) | Install official Android skills, device streaming |
| Android Studio Gemini / Journeys | Natural-language UI tests on device (if the user has it) |
| Material Theme Builder | Generate color schemes from a brand seed |
| Figma / Stitch MCP | Read the source design when one exists; compare parity |

Use fully qualified MCP tool names when instructing other agents (for example `maestro:inspect_screen`).

## Multi-agent use

- Reviewer agent runs `critique`/`audit` read-only; builder agent runs `build`/`redesign`; a fresh verifier runs `see` + `release-review`. The author does not approve its own work.
- Pass `DESIGN.md`, the brief and the evidence JSON between agents instead of long chat summaries.

## Evals: proving the skill helps

`evals/evals.json` contains scenarios in the Anthropic evaluation format (query, files, expected_behavior). Run each scenario with and without the skill on the same model and compare against the expected behaviors; record results in `evals/RESULTS.md`. Re-run after every significant edit to the skill and test on every model you support (fast and large models differ in how much guidance they need).

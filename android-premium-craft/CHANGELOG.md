# Changelog

## v2.1.0 - 2026-10-29

- **Master critique** (`critique` mode at full depth): capture -> design review before tools -> deterministic scan -> Craft Score -> report -> targeted questions -> action plan. New module `modules/09-verify/master-critique.md` with Android personas (Casey, Sam, Rita, Alex, Riley) and a cognitive-load / Nielsen cross-check.
- New `scripts/critique_score.py`: Craft Score 0-100 from evidence-backed rubric scores, published weights, P0/P1 caps, confidence from visual coverage, grade bands, archive and trend (`--save`).
- New `assets/CRITIQUE_TEMPLATE.json`; `critique quick` keeps the short version.
- README scorecard image generated from real script output; 51 tests.

## v2.0.0 - 2026-10-29

**Architecture**
- SKILL.md rewritten as a 167-line router (principles, craft loop, 24 modes, module index, official-skill hand-offs).
- 30 modules in 11 groups (discover, direction, system, layout, components, motion, accessibility, performance, verify, platforms, agents) + research ledger. All links one level deep; long files have a Contents section.
- Repository layout for plugin marketplaces (`.claude-plugin/`, `.codex-plugin/`).

**New knowledge**
- 10 named aesthetic anchors; Android anti-slop catalogue with lint ids; squint test.
- Design system modules: color roles, contrast levels (API 34), dark theme, semantic/extended colors; M3 type scale, tabular numerals, 200% scaling, line breaking; shape/space/elevation tokens; iconography, app icon, images; theming code incl. Expressive and Styles API gates.
- Layout, edge-to-edge (SDK 35/36), adaptive (window size classes incl. large/xl, SDK 36/37 large-screen rules), navigation and predictive back, components catalogue, forms/IME/autofill, states and haptics, UX copy and i18n/RTL, data display.
- Motion system with MotionScheme springs; accessibility semantics recipes and manual scripts; performance method with honest reporting.
- Visual feedback loop, device matrix, screenshot testing, critique rubric (10 dimensions, no averaged score), release gates with `incomplete` decision.
- Form factors (Wear, TV, Cars, XR, widgets, notifications) and toolkit map (Views, Flutter, React Native, CMP).
- Agent setup for Claude Code, Codex, Antigravity (Gemini CLI replaced for many tiers in June 2026), always-on AGENTS snippet.

**Tools**
- `ui_audit.py lint`: 39 rules, suppression comments, Markdown/JSON/SARIF, `--fail-on`. `palette`: WCAG check of every role pair in Kotlin schemes. `contrast`: `#AARRGGBB` compositing.
- `project_probe.py`: SDK levels, Compose BOM, Material 3, Kotlin, libraries, toolkit verdict, manifest flags, platform mandates.
- New `device_matrix.py` (14 profiles, adb, restore and `--restore-only`), `validate_skill.py`.
- `review_gate.py` v2 schema (states, adaptive, `not_applicable`, P0-P3 issues, decision levels), still accepts v1 reports.
- Templates: `CraftTheme.kt`, `CraftPreviews.kt`, `A11yCheckTest.kt`, `DESIGN_TEMPLATE.md`, `AGENTS_SNIPPET.md`.
- `evals/` with 9 scenarios and a sloppy fixture app; 42 unit tests.

**Changed**
- Dark-only is no longer a default; it is one anchor (Tonal Calm) among ten.
- Modes `touch/space/harden/accessibility` kept; overlapping guidance consolidated into modules.

## v1.2 - 2026-10-28
- Evidence states PASS/FAIL/NOT RUN; accessibility, visual-regression, performance and release-review modes; version-aware screenshot strategy; `project_probe.py`; `review_gate.py`.

## v1.1 - 2026-10-28
- Research references, video study, Codex/Gemini/Claude install.

## v1.0 - 2026-10-28
- Native Android critique/redesign/touch/space/animate/audit flow with static scanner.

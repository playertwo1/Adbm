---
name: android-premium-craft
description: Designs, builds, critiques and verifies native Android app interfaces to a premium, release-ready standard - visual direction and design tokens, Material 3 and M3 Expressive, Jetpack Compose and XML Views, layout, adaptive and edge-to-edge, touch, accessibility, motion, haptics, UX copy, screen states, performance, and screenshot or device-matrix verification with honest evidence. Use when creating or redesigning an Android screen, theme or design system; reviewing screenshots or Compose/XML code for UI quality; making an app look less generic or more polished; fixing insets, tap targets, TalkBack, font scaling, dark theme, tablets, foldables, animation or jank; or preparing a UI release review. Not for backend, data-layer or build-only work.
license: Apache-2.0
metadata:
  version: "2.1.0"
  updated: "2026-10-29"
---

# Android Premium Craft v2

Ship Android UI that **looks intentional, feels instant and survives real use**: a clear hierarchy, a coherent system, honest states, reachable targets, readable text at 200%, purposeful motion and evidence for every claim. Beauty is the result of decisions, not decoration.

This file is a router. Load only the modules the current mode needs (links below are one level deep). Scripts run without loading their source.

## Quick start

- Claude Code: `/android-premium-craft <mode> [screen or task]`
- Codex: `$android-premium-craft <mode> ...` | Antigravity / Gemini CLI: "use android-premium-craft <mode> ..."
- No mode given: run `critique` on the screen in focus, then propose the next mode.

## Non-negotiables

1. **Recon before opinions.** Read the toolkit (Compose/Views/hybrid), theme, components, `compileSdk`/`targetSdk`, Compose BOM, Material 3 version, navigation library and test setup. Run `scripts/project_probe.py`. Never assume an API exists in the project's version.
2. **Preserve behavior and scope.** No toolkit migration, dependency upgrade, navigation rewrite or global theme change unless asked. Touch the fewest files. Business logic is out of scope.
3. **Decide a direction, then a system, then pixels.** Pick one named anchor from [aesthetic-anchors](modules/02-direction/aesthetic-anchors.md), encode it as tokens, and build only with tokens. No hex literals, raw `sp` or ad-hoc `dp` in screens.
4. **Never ship slop.** Check every screen against [anti-slop](modules/02-direction/anti-slop.md). Defaults (baseline purple, card-everything, gradient hero, centered everything, emoji icons) are not a design.
5. **Touch, space and access are design, not QA.** Hit area >=48dp, insets handled once, text scales to 200% without loss, every control has a TalkBack name/role/state, gesture actions have visible or custom-action alternatives, color is never the only signal.
6. **States before screenshots.** Design loading, empty, error, offline, partial, permission and long-content states with the happy path, not after it.
7. **Motion must earn its frame.** Use the theme `MotionScheme` springs, keep it interruptible, respect reduced motion, never block input. Claim smoothness only with a same-device measurement.
8. **See what you built.** Render previews or capture the device, look at the pixels, critique against the rubric, fix, repeat. Code review alone is not visual review.
9. **Evidence vocabulary.** Report each claim as `observed`, `verified-in-code`, `measured`, `automated-pass` or `not-run`. No invented FPS or test results; scores come only from evidence-backed rubric judgments run through `critique_score.py`.

## The craft loop

Copy this checklist into the work log and tick it off. Skip steps the mode does not need.

```
- [ ] 0 Recon     probe + read theme/components      -> modules/01-discover/project-recon.md
- [ ] 1 Brief     user, job, context, domain register -> modules/01-discover/product-brief.md
- [ ] 2 Direction one anchor + anti-slop guardrails   -> modules/02-direction/*
- [ ] 3 System    tokens: color/type/shape/space/motion -> modules/03-system/*
- [ ] 4 Build     layout, components, states, copy    -> modules/04-layout/*, 05-components/*
- [ ] 5 See       render or capture, look at pixels   -> modules/09-verify/visual-feedback-loop.md
- [ ] 6 Critique  Craft Score, top 5 findings         -> modules/09-verify/master-critique.md
- [ ] 7 Harden    a11y, matrix, edge cases, motion    -> modules/07-accessibility, 09-verify/device-matrix.md
- [ ] 8 Gate      evidence JSON + review_gate.py      -> modules/09-verify/release-gates.md
```

Feedback rule: after step 5 or 7 finds a P0/P1, fix and repeat from step 5. Stop after two repair passes and report what remains.

## Modes

| Mode | Purpose | Load | Edits |
|---|---|---|---|
| `critique` (default) | Master critique: Craft Score 0-100 + scorecard, top 3-5 issues, persona red flags, quick wins, action plan. `critique quick`: 2 strengths + 5 findings, no score | master-critique, critique-rubric, anti-slop | No |
| `shape` | Brief + anchor + token proposal before any code | product-brief, aesthetic-anchors, 03-system | No |
| `system` | Create or document the design system (`DESIGN.md` + theme code) | 03-system, tokens-and-theming | On request |
| `build` | New screen or flow from an approved direction | 04, 05, states, visual loop | Yes |
| `redesign` | Rework an existing screen to an approved direction | as `build` + critique | Yes |
| `polish` | Alignment, rhythm, type, icons, states, micro-motion; no re-architecture | anti-slop, 03-system, motion | Yes |
| `bolder` / `quieter` | Raise or lower visual intensity within the anchor | aesthetic-anchors, color, typography | Yes |
| `distill` | Remove nested cards, duplicate labels, decoration, chrome | anti-slop, layout-and-hierarchy | Yes |
| `touch` | Reach, targets, feedback, gestures, haptics | accessibility, states-and-feedback | On request |
| `space` | Edge-to-edge, insets, IME, density, first viewport | edge-to-edge-insets, layout | On request |
| `adapt` | Tablets, foldables, desktop windows, orientation, input devices | adaptive, form-factors | On request |
| `animate` | Purposeful, interruptible motion with fallbacks | motion-system | On request |
| `copy` | Labels, errors, empty states, i18n, RTL | content-and-copy | On request |
| `harden` | Every state, edge case and stress configuration | states-and-feedback, device-matrix, accessibility | On request |
| `accessibility` | TalkBack, 200% text, targets, contrast, keyboard, switch | accessibility | No unless asked |
| `audit` | Probe + lint + palette check + rubric, ranked report | project-recon, critique-rubric | No |
| `see` | Render/capture, then self-critique loop | visual-feedback-loop | No |
| `matrix` | Capture the screen across the device matrix | device-matrix | No |
| `visual-regression` | Version-correct screenshot tests, reviewed baselines | screenshot-testing | No auto-approve |
| `performance` | Baseline then targeted fix then re-measure | performance | After baseline |
| `reference` / `motion-study` | Extract principles from references or recordings | reference-and-motion-study | No |
| `release-review` | PASS/FAIL/NOT-RUN per check with blockers | release-gates | No |

Typical chains: new app `shape -> system -> build -> see -> harden -> release-review`; "looks generic" `critique -> shape -> redesign -> polish -> see`; jank `performance -> animate -> performance`.

## Module index

**01 Discover**
- [project-recon.md](modules/01-discover/project-recon.md) - stack, versions, platform mandates, existing system
- [product-brief.md](modules/01-discover/product-brief.md) - user, job, context of use, domain register

**02 Direction**
- [aesthetic-anchors.md](modules/02-direction/aesthetic-anchors.md) - 10 named directions with full recipes
- [anti-slop.md](modules/02-direction/anti-slop.md) - generic-AI patterns, why they fail, the fix
- [reference-and-motion-study.md](modules/02-direction/reference-and-motion-study.md) - screenshots, recordings, originality

**03 System**
- [color.md](modules/03-system/color.md) - roles, dynamic vs brand, dark theme, contrast levels, semantic and chart colors
- [typography.md](modules/03-system/typography.md) - type roles, fonts, numerals, scaling, line breaking
- [shape-space-elevation.md](modules/03-system/shape-space-elevation.md) - 4dp grid, shape scale, tonal elevation, density
- [iconography-imagery.md](modules/03-system/iconography-imagery.md) - Material Symbols, app icon, images, illustration
- [tokens-and-theming.md](modules/03-system/tokens-and-theming.md) - Theme code, extended tokens, Expressive, Styles API, Views

**04 Layout**
- [layout-and-hierarchy.md](modules/04-layout/layout-and-hierarchy.md) - first viewport, grouping, density, canonical layouts
- [edge-to-edge-insets.md](modules/04-layout/edge-to-edge-insets.md) - enforced edge-to-edge, insets, IME, cutouts
- [adaptive.md](modules/04-layout/adaptive.md) - window size classes, panes, resizability, input devices

**05 Components**
- [navigation-patterns.md](modules/05-components/navigation-patterns.md) - bars, rails, app bars, tabs, predictive back
- [components-catalog.md](modules/05-components/components-catalog.md) - which component, anatomy, misuse
- [forms-and-input.md](modules/05-components/forms-and-input.md) - fields, keyboards, autofill, validation
- [states-and-feedback.md](modules/05-components/states-and-feedback.md) - loading, empty, error, offline, undo, haptics
- [content-and-copy.md](modules/05-components/content-and-copy.md) - UX writing, numbers, i18n, RTL
- [data-display.md](modules/05-components/data-display.md) - dashboards, charts, tables, numeric honesty

**06 Motion** - [motion-system.md](modules/06-motion/motion-system.md) - purpose taxonomy, springs, transitions, reduced motion

**07 Accessibility** - [accessibility.md](modules/07-accessibility/accessibility.md) - semantics recipes, manual scripts, automated checks

**08 Performance** - [performance.md](modules/08-performance/performance.md) - perceived speed, Compose rules, measurement

**09 Verify**
- [visual-feedback-loop.md](modules/09-verify/visual-feedback-loop.md) - how to see the UI and self-critique
- [device-matrix.md](modules/09-verify/device-matrix.md) - stress configurations and capture script
- [screenshot-testing.md](modules/09-verify/screenshot-testing.md) - tool choice by version, baseline hygiene
- [master-critique.md](modules/09-verify/master-critique.md) - score an existing app like a design director: capture, review, scan, Craft Score, plan
- [critique-rubric.md](modules/09-verify/critique-rubric.md) - 10 dimensions, scoring anchors, severity
- [release-gates.md](modules/09-verify/release-gates.md) - evidence JSON, decision levels

**10 Platforms**
- [form-factors.md](modules/10-platforms/form-factors.md) - tablet, foldable, desktop, Wear, TV, Auto, XR, widgets, notifications
- [toolkits.md](modules/10-platforms/toolkits.md) - XML Views, Flutter, React Native, Compose Multiplatform

**11 Agents** - [agent-setup.md](modules/11-agents/agent-setup.md) - install paths, always-on snippet, MCP tools, evals

**Research** - [evidence.md](research/evidence.md) (what is proven vs opinion) and [sources.md](research/sources.md)

## Hand off to official Android skills

When the task is mostly one of these, follow the official skill (Google's `android/skills`) if installed, and keep this skill for direction, critique and verification.

| Task | Official skill |
|---|---|
| Edge-to-edge migration, IME, system bar legibility | `edge-to-edge` |
| Multi-pane, nav rail, MediaQuery, Grid/FlexBox | `adaptive` |
| Recomposition, lazy lists, stability, jank fixes | `jetpack-compose-performance` |
| Navigation 3 migration | `navigation-3` |
| Back interception, predictive back on SDK 36+ | `navigation-event` |
| Compose Styles API (experimental) | `styles` |
| XML to Compose | `migrate-xml-views-to-jetpack-compose` |
| Test infrastructure, screenshot test setup | `testing-setup` |
| Wear OS / TV / XR glasses / widgets | `wear-compose-m3`, `leanback-to-compose-tv-migration`, `display-glasses-with-jetpack-compose-glimmer`, `glance-canonical-layouts` |

Not installed? Proceed with this skill's module and the linked developer.android.com page.

## Tools (stdlib Python 3.9+, read-only on the app)

```bash
python scripts/project_probe.py <app> --format markdown        # versions, mandates, screenshot advice
python scripts/ui_audit.py lint <app> --format markdown          # 39 craft rules; --format sarif for CI
python scripts/ui_audit.py palette <app>                        # theme role pairs vs WCAG contrast
python scripts/ui_audit.py contrast '#B3FFFFFF' '#121316'        # supports #AARRGGBB over a background
python scripts/device_matrix.py --out shots/ --profiles core     # adb stress capture; restores settings
python scripts/critique_score.py critique.json --save .craft/critique  # Craft Score 0-100 + trend
python scripts/review_gate.py evidence.json --require-ready      # lints the evidence report
python scripts/validate_skill.py                                 # self-check of this skill
```

Lint, palette and probe are heuristics: a finding is a lead to verify, a clean run is not a pass. `device_matrix.py` changes device settings temporarily and restores them; use `--dry-run` first on a personal phone.

## Output contract

Every mode ends with: **what changed or was found -> evidence (file:line, screenshot, measurement) -> status per check -> the single next action**. Keep findings to the top five by user impact. Separate *usability defect*, *platform requirement*, *research-backed hypothesis* and *taste*.

# Screenshot testing

Screenshot tests protect a polished UI from silent regressions. Choose the tool by the project's real versions; never upgrade the build just to get one.

## Contents
- Decision tree
- What to capture
- Baseline hygiene
- Reviewing diffs

## Decision tree

1. Read AGP, Compose and existing test modules (`project_probe.py` gives hints; confirm in Gradle files). Unknown stays unknown.
2. **A screenshot tool already exists** (Roborazzi, Paparazzi, Dropshots, Compose Preview Screenshot Testing): extend it. Do not stack a second tool.
3. **None exists, regression risk is real** (design system, many screens, CI): pick one:
   - Roborazzi - Robolectric on the JVM, works with Compose and Views, fast in CI, ATF accessibility checks available.
   - Paparazzi - LayoutLib on the JVM, no emulator, fast; renders without real device services.
   - Compose Preview Screenshot Testing with AGP test suites - official, preview-based; **experimental** on AGP 9.5 alpha+; the earlier standalone `com.android.compose.screenshot` plugin is no longer maintained, do not add it.
   - Dropshots / instrumented - real device rendering, slower; best for final fidelity.
4. **One-off redesign**: manual before/after captures (adb or `device_matrix.py`) are enough; no new framework.

For full test-infrastructure setup follow the official `testing-setup` skill.

## What to capture

- Each screen: content, loading, empty, error (from `UiState` previews).
- Each design-system component: all variants and states (enabled, pressed where possible, disabled, error, selected).
- Configurations: light/dark, font scale 1.0 and 2.0, compact and expanded width, RTL for screens with directional layouts.
- Deterministic data: fixed clock, fixed locale, no network images (use placeholders or local fixtures), animations paused or at end state.

## Baseline hygiene

- Freeze: device/renderer, density, resolution, font scale, locale, time zone, theme, API level, fonts available, library versions.
- JVM renderers and devices differ; keep baselines per renderer; do not compare across.
- Tight diff tolerances; a large tolerance hides real regressions.
- **Never re-record baselines to make CI green.** Every changed image is reviewed by a human or agent with the intent of the change written down.
- No private customer data in screenshots or third-party diff services.

## Reviewing diffs

For each changed image: is the change intended (listed in the PR)? Did anything else move (spacing, color, clipping)? Is the new version better against the rubric? Approve per image with a one-line reason; reject unintended diffs and fix the code.

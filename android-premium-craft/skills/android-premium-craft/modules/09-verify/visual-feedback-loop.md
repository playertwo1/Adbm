# Visual feedback loop: see what you built

Agents that cannot see their output ship generic or broken UI. Close the loop: **render -> look -> critique -> fix -> re-render**.

## Contents
- Pick the fastest way to see
- Route A: Compose previews to PNG
- Route B: device or emulator capture
- Route C: Maestro MCP
- How to look at a screenshot
- Loop discipline

## Pick the fastest way to see

| Situation | Route |
|---|---|
| Compose screen with previews, screenshot tooling present | A - render previews |
| App runs on an emulator/device, adb available | B - capture with adb or `device_matrix.py` |
| Maestro MCP connected | C - `inspect_screen` + `take_screenshot` |
| Nothing runnable | Ask the user for screenshots; review code with the rubric and mark visual checks `not-run` |

Prefer the route the project already supports. Do not install a screenshot framework only to look at one screen.

## Route A: Compose previews to PNG

1. Make previews that matter: one per state (`@PreviewParameter`), plus `@PreviewLightDark`, `@PreviewFontScale`, `@PreviewScreenSizes`. Use [CraftPreviews.kt](../../assets/compose/CraftPreviews.kt).
2. Render with what the project has:
   - Roborazzi: `./gradlew recordRoborazziDebug` (Robolectric, JVM), images under `build/outputs/roborazzi`.
   - Paparazzi: `./gradlew recordPaparazziDebug`.
   - AGP test-suite Compose screenshot testing (experimental, AGP 9.5 alpha+): follow the official setup; do not upgrade AGP for it.
   - Optional community CLI that renders `@Preview` to PNG outside Studio (for example yschimke's `compose-preview` skills) when the user wants it.
3. Open the PNGs (agents with vision: read the image files) and run the review below.

## Route B: device or emulator capture

```bash
adb devices
adb exec-out screencap -p > shot.png                       # current screen
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml   # view tree with bounds
python scripts/device_matrix.py --out shots/ --profiles core --dump  # matrix capture, restores settings
```

- `uiautomator` bounds let you **measure** touch targets and spacing in pixels; divide by `density/160` for dp (`adb shell wm density`).
- For a fresh state, relaunch: `adb shell am start -W -n <pkg>/<activity>`.
- Keep the user's device safe: `device_matrix.py --dry-run` prints commands first; settings are restored on exit.

## Route C: Maestro MCP

`list_devices` -> `inspect_screen` (hierarchy with bounds and text) -> `take_screenshot`. Write a small flow to reach the screen (`launchApp`, `tapOn`) and reuse it after every change. Maestro flows double as regression tests for the critical journey.

## How to look at a screenshot

Review at 100% device scale, then downscaled to 25% (squint test). Answer in writing:

1. **Hierarchy**: first, second, third thing seen. Matches the brief?
2. **Alignment**: do edges line up on keylines? Any element off by a few dp?
3. **Rhythm**: are gaps from the spacing scale and consistent for the same relationship?
4. **Type**: how many sizes/weights? Any clipped, truncated or orphaned text?
5. **Color**: where is the accent spent? Any low-contrast text? Any color-only meaning?
6. **Targets**: measure the smallest interactive element in the dump; >= 48dp?
7. **Chrome vs content**: share of the viewport used by bars and decoration.
8. **Insets**: content under status bar, nav bar, cutout or IME?
9. **States**: does this screenshot represent the worst case (long text, empty, error)?
10. **Slop**: any item from [anti-slop.md](../02-direction/anti-slop.md)?

Score with [critique-rubric.md](critique-rubric.md) and list findings with the screenshot file name as evidence.

## Loop discipline

- One change set per loop; re-render the same previews/profiles to compare like with like.
- Keep before/after pairs with identical device, theme, font scale, locale and data.
- Stop after two repair loops; report remaining issues with severity instead of looping forever.
- Never claim "looks great" without having looked at pixels in this session.

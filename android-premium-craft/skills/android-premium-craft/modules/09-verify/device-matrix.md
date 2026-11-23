# Device matrix

Most UI bugs hide in configurations nobody looked at. Capture the same screen across stress profiles and review them side by side.

## Contents
- Profiles
- Running the script
- Manual-only checks
- Reading the results

## Profiles

`scripts/device_matrix.py` applies each profile with adb, waits for the UI to settle, captures a PNG (and optionally the view tree), then **restores every changed setting**.

| Profile | What it sets | Catches |
|---|---|---|
| `baseline` | Nothing (current state) | Reference image |
| `dark` | `cmd uimode night yes` | Hard-coded colors, missing dark assets |
| `light` | `cmd uimode night no` | Same, opposite theme |
| `font130` | `font_scale 1.3` | Early wrapping issues |
| `font200` | `font_scale 2.0` (Android 14+) | Clipping, overlap, fixed heights |
| `display_large` | `wm density` x1.25 | Display-size (zoom) breakage |
| `bold` | `font_weight_adjustment 300` (Android 12+) | Fixed widths around text |
| `high_contrast_text` | `high_text_contrast_enabled 1` | Low-contrast assumptions |
| `motion_off` | animator/transition/window scales 0 | Meaning that depends on motion |
| `nav_3button` | 3-button navigation overlay | Bottom inset handling |
| `nav_gesture` | Gesture navigation overlay | Gesture-area conflicts |
| `rtl` | Per-app locale `ar` (needs `--package`, Android 13+) | Mirroring, start/end bugs |
| `pseudo_long` | Per-app locale `en-XA` (needs pseudo-locales enabled in the debug build) | Text expansion |
| `landscape` | `user_rotation 1` with auto-rotate off | Compact height, cutouts |

Profile groups: `core` = baseline, dark, font200, rtl, landscape, nav_3button; `font` = font130, font200, bold; `nav` = nav_3button, nav_gesture; `motion` = motion_off; `all` = everything.

## Running the script

```bash
python scripts/device_matrix.py --list                          # show profiles and groups
python scripts/device_matrix.py --out shots/run1 --profiles core --package com.example.app --dry-run
python scripts/device_matrix.py --out shots/run1 --profiles core --package com.example.app --dump
python scripts/device_matrix.py --out shots/run1 --profiles font200,dark --serial emulator-5554 --settle 3
```

- Open the target screen before running; configuration changes recreate the activity, so the app must restore its own state (a finding if it does not).
- Output: `shots/run1/<profile>.png`, optional `<profile>.xml` view tree, and `manifest.json` (device model, API level, density, every command run, restore result).
- On a personal phone run `--dry-run` first. If the script is interrupted hard (killed), re-run with `--restore-only` using the saved `original_settings.json` in the output folder.

## Manual-only checks

These change the device too much for automation or need a human:
- TalkBack walkthrough (see [accessibility.md](../07-accessibility/accessibility.md)).
- Contrast setting (Settings > Accessibility > Color and motion > Contrast, Android 14+).
- Color correction and grayscale.
- Physical keyboard and mouse.
- Foldable postures (emulator: resizable/foldable AVD with posture controls).
- Desktop windowing / free resize.

## Reading the results

Put screenshots side by side (baseline vs each profile). For each, note: clipped text, overlapping elements, unreachable primary action, wrong colors, broken mirroring, content under bars. Each defect becomes a finding with the profile name and file as evidence. A profile that could not be applied (old API level, missing package) is `not-run` with the reason from `manifest.json`.

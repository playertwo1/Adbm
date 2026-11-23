# Color

## Contents
- Decide the color strategy
- Use roles, not colors
- Dark theme that looks expensive
- Contrast: targets, levels and checking
- Semantic, extended and chart colors
- Views equivalents

## Decide the color strategy

| Situation | Strategy |
|---|---|
| No strong brand, consumer or utility app | Dynamic color on (Android 12+), with a designed fallback scheme for older devices |
| Strong brand | Static brand scheme generated from the brand seed (Material Theme Builder or material-color-utilities); dynamic color off, or harmonize semantic colors with it |
| Brand plus personalization | Dynamic color for neutrals and secondary, brand kept for primary or one hero element |

Never ship the baseline sample scheme (`#6750A4` purple). Generate light **and** dark schemes from the same seed, plus medium- and high-contrast variants if the app supports custom contrast.

## Use roles, not colors

| Role pair | Use for | Rule |
|---|---|---|
| `primary` / `onPrimary` | The one main action, active selection, key progress | Spend it sparingly; if everything is primary nothing is |
| `primaryContainer` / `onPrimaryContainer` | Emphasized but softer: selected chips, hero cards, FAB | Good default for expressive emphasis |
| `secondary*`, `tertiary*` | Supporting accents, contrasting highlights | Tertiary is for balance and contrast, not a third brand |
| `surface`, `surfaceContainerLowest..Highest` | Page and component backgrounds by depth | Higher container = more elevated or more prominent grouping |
| `onSurface` / `onSurfaceVariant` | Primary text / secondary text and icons | Secondary text is a role, never alpha |
| `outline` / `outlineVariant` | Borders of inputs (needs 3:1) / decorative dividers | Dividers use `outlineVariant` |
| `error`, `errorContainer` | Errors and destructive emphasis | Pair with icon and text |
| `inverseSurface`, `inversePrimary` | Snackbars, tooltips on the opposite theme | |
| `scrim` | Behind modals and over media for legible text | |

In Compose read colors only from `MaterialTheme.colorScheme` or the app's extended tokens. `contentColorFor(background)` and the `on*` pairing keep text legible when containers change.

## Dark theme that looks expensive

- Build depth with the tonal surface ramp, not with shadows or random grays.
- Keep at most one saturated accent visible at a time; desaturate large accent areas.
- Do not use pure white body text on near-black for long reading; `onSurface` from a generated scheme is already tuned.
- Pure black (`#000000`) is a deliberate OLED/"lights out" choice: then keep surfaces black and separate groups with spacing and `outlineVariant`, not with gray boxes.
- Images and illustrations need dark variants or a subtle scrim; logos need a light-on-dark version.
- Test both themes on the device in sunlight-like brightness and at minimum brightness.

## Contrast: targets, levels and checking

| Element | Minimum (WCAG 2.x AA) |
|---|---|
| Body text, labels | 4.5:1 |
| Large text (>=24sp regular or >=18.66sp bold) | 3:1 |
| Meaningful icons, input borders, focus indicators, chart marks | 3:1 against adjacent colors |
| Disabled controls | Exempt, but still recognizable as disabled |

- Check **composited** colors: text with alpha over a surface, a scrim over an image, a selected-state overlay. `python scripts/ui_audit.py contrast '#B3FFFFFF' '#121316'` composites `#AARRGGBB` over the background.
- `python scripts/ui_audit.py palette <app>` reads `lightColorScheme(...)`/`darkColorScheme(...)` in Kotlin and checks every role pair.
- Android 14+ exposes a user **contrast level** (`UiModeManager.getContrast()`, -1..1). Dynamic color handles it automatically; a custom brand scheme should ship medium/high-contrast variants and pick by contrast level (MDC `ColorContrast` does this for Views).
- Also verify with Settings > Accessibility: high contrast text, color correction and grayscale (bedtime mode) to catch color-only meaning.

## Semantic, extended and chart colors

- Material 3 has no success/warning roles. Add them as **extended tokens** with the same four-part structure (`success`, `onSuccess`, `successContainer`, `onSuccessContainer`) for light, dark and contrast levels. Harmonize them toward the primary hue when dynamic color is on (MDC `MaterialColors.harmonize`, or the color utilities' blend).
- Status always pairs color with an icon or text ("Overdue", "+12.4%").
- Chart palettes: 6-8 categorical hues with similar perceived lightness, checked for color-vision deficiency; sequential palettes for magnitude; never red/green as the only distinction. See [data-display.md](../05-components/data-display.md).

## Views equivalents

`Theme.Material3.DayNight.NoActionBar` (or `...DynamicColors...`), `DynamicColors.applyToActivitiesIfAvailable(app)`, `?attr/colorPrimary`, `?attr/colorOnSurfaceVariant`, `?attr/colorSurfaceContainer`. No hex values in layout XML.

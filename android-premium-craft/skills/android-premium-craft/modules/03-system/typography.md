# Typography

## Contents
- The Material 3 type scale
- Building hierarchy
- Choosing and loading fonts
- Numbers, data and codes
- Scaling to 200% without breaking
- Line breaking, length and languages

## The Material 3 type scale

Baseline values (size / line height, sp). Use the roles, tune the font family and weights to the anchor.

| Role | Large | Medium | Small | Typical use |
|---|---|---|---|---|
| display | 57/64 | 45/52 | 36/44 | Hero numbers, onboarding, editorial headlines |
| headline | 32/40 | 28/36 | 24/32 | Screen titles on large layouts, section heroes |
| title | 22/28 | 16/24 (500) | 14/20 (500) | App bar titles, card titles, list headers |
| body | 16/24 | 14/20 | 12/16 | Content; 16sp for reading surfaces |
| label | 14/20 (500) | 12/16 (500) | 11/16 (500) | Buttons, chips, tabs, captions |

Material 3 Expressive adds **emphasized** variants of each role (heavier weight) for hero moments; they are part of the expressive API surface, so verify the Material 3 version and opt-in before use.

## Building hierarchy

- Three levels per screen are usually enough: one display/headline, one title, body. A fourth (label) for metadata.
- Contrast between levels should be obvious: size ratio >= 1.25 or a weight jump of 200+ between adjacent levels.
- Hierarchy can come from weight and color role (`onSurface` vs `onSurfaceVariant`) as much as size.
- Never fake headings by bolding body text; use a role and mark it `semantics { heading() }`.
- `labelSmall` (11sp) is for non-essential metadata only. Data a user acts on is 12sp minimum, 14sp preferred.

## Choosing and loading fonts

- Default: the system/brand-neutral face (Roboto Flex or the device font) is a valid premium choice when hierarchy is strong.
- A character face for headings is the cheapest way to look distinct (Editorial, Bold Brand, Playful anchors). Keep UI labels in a highly legible sans.
- Prefer variable fonts: one file, precise weights, optical size (`FontVariation.Settings`).
- Downloadable Google Fonts (`androidx.compose.ui:ui-text-google-fonts`) avoid bundling; bundle when offline-first or when the brand font is proprietary. Provide fallbacks; check glyph coverage for every shipped language.
- Never set `fontSize` in screens. Define the `Typography` once; override per role.

## Numbers, data and codes

- Tabular figures for anything that updates or aligns: `TextStyle(fontFeatureSettings = "tnum")`.
- Right-align numeric columns; align decimals.
- Currency, units and signs are part of the number: "R$ 1.234,56", "-12,4 %", "3 h 20 min". Format with locale-aware formatters, never string concatenation.
- Monospace only for codes, IDs, logs.

## Scaling to 200% without breaking

Android 14+ scales fonts nonlinearly up to 200% (large text grows less than small text). Design for it:
- Use `sp` for text, `dp` for layout. In Compose, `TextUnit` sp scales; Views `textSize` must be `sp` [lint X001].
- No fixed heights on text containers; use `heightIn(min = ...)` [lint A006].
- Allow wrapping; when you must truncate, use `maxLines` + `TextOverflow.Ellipsis` and make the full text reachable (detail screen, tooltip, `contentDescription`).
- Rows with label + value switch to stacked layout when they do not fit (`FlowRow`, or measure with `BoxWithConstraints`).
- Icons next to text can scale with text where meaning depends on it (convert sp to dp with `LocalDensity`).
- Test at 1.0, 1.3 and 2.0 with `@PreviewFontScale` and `device_matrix.py --profiles font`.

## Line breaking, length and languages

- Readable line length: 45-75 characters. On tablets, constrain body width (`widthIn(max = 640.dp)`) or use columns.
- Paragraph-quality breaking for long text: `TextStyle(lineBreak = LineBreak.Paragraph, hyphens = Hyphens.Auto)`; `LineBreak.Heading` for titles.
- Line height: 1.4-1.6x for body; tighter (1.1-1.25x) for display.
- Some scripts (Thai, Arabic, Devanagari, CJK) need taller line heights and different fonts; never clip with fixed line heights. Test with pseudo-locales `en-XA` (expansion, accents) and `ar-XB` (RTL).

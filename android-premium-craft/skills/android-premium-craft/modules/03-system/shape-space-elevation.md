# Shape, space and elevation

## Contents
- Spacing scale
- Margins, keylines and grid
- Shape scale and meaning
- Elevation and depth
- Density

## Spacing scale

Use a 4dp base grid and name the steps so screens never contain raw numbers.

| Token | dp | Use |
|---|---|---|
| `xxs` | 2 | Hairline adjustments, icon-to-badge |
| `xs` | 4 | Icon to label inside a component |
| `s` | 8 | Between related items, chip gaps |
| `m` | 12 | Inside dense components, list item vertical padding |
| `l` | 16 | Screen margin on compact, card padding, between groups of controls |
| `xl` | 24 | Between sections, screen margin on medium/expanded |
| `xxl` | 32 | Major section breaks, hero spacing |
| `xxxl` | 48+ | Top of hero, empty-state breathing room |

Rules: proximity encodes relationship (related items closer than unrelated); one spacing step per relationship level; vertical rhythm stays consistent down the page.

## Margins, keylines and grid

| Window width class | Screen margin | Columns (guide) | Max reading width |
|---|---|---|---|
| Compact (<600dp) | 16dp | 4 | full |
| Medium (600-839dp) | 24dp | 8 | ~640dp per pane |
| Expanded+ (>=840dp) | 24dp, panes with 24dp spacer | 12 | panes or centered max width |

- Align text and icons on keylines: leading icons at 16dp, text at 56dp or 72dp in lists (Material list anatomy).
- Bleed media to edges when it is the content; keep text on the margin.

## Shape scale and meaning

Material 3 shape tokens (dp corner radius):

| Token | Radius | Typical |
|---|---|---|
| none | 0 | Full-bleed media, editorial |
| extraSmall | 4 | Text field, snackbar, tooltips |
| small | 8 | Chips, small buttons, menus |
| medium | 12 | Cards, dialogs on compact |
| large | 16 | FAB, navigation drawer, large cards |
| largeIncreased (Expressive) | 20 | Emphasized large components |
| extraLarge | 28 | Bottom sheets, dialogs, hero containers |
| extraLargeIncreased / extraExtraLarge (Expressive) | 32 / 48 | Hero and playful surfaces |
| full | 50% | Pill buttons, FAB variants, avatars, selected nav indicator |

- Pick a **small set** (two or three) per app and apply by component type. Random radii read as unfinished.
- Nested shapes: inner radius = outer radius - padding, or the inner element looks pinched.
- Expressive: shape changes carry meaning (selected item rounds more, pressed button squishes, `MaterialShapes` polygons morph for loading or selection). Keep it purposeful and verify the API version.

## Elevation and depth

- Material 3 expresses depth with **tonal elevation** (surface container roles), and shadows only where an element truly floats (FAB, menus, dragged items, modal sheets).
- Use `surfaceContainerLow..Highest` for depth steps. In Compose prefer `Surface(color = ..., tonalElevation = ...)` or set container colors explicitly; avoid `Modifier.shadow` on static content.
- Scrims separate modal layers; `scrim` role with ~32% opacity is a starting point, verify text contrast through it.
- Dividers are a last resort; whitespace and container tone separate groups more quietly.

## Density

- Density changes spacing and visual size, **never** the 48dp touch target. Dense lists keep 48dp rows minimum.
- Offer density through layout (more columns, compact rows on expanded windows), not through smaller text.
- Measure the first viewport: list how many meaningful items are visible on a 360x800dp phone. If chrome (bars, hero, banners) takes more than ~35% of the viewport, distill.

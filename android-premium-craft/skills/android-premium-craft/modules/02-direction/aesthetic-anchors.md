# Aesthetic anchors

"Make it clean and modern" produces the average of the training data. Instead, choose **one named anchor**, state it in the brief, and let it decide every token. Anchors are vocabularies, not templates: the product's brand and content still lead.

## Contents
- How to choose
- The ten anchors (recipe per anchor)
- Mixing and tuning
- Writing the anchor into DESIGN.md

## How to choose

1. Start from the domain register in [product-brief.md](../01-discover/product-brief.md).
2. Respect what exists: if the app has a brand system, the anchor only fills its gaps.
3. Pick by the user's job, not by the designer's taste: dense jobs want *Precision Pro*, glance jobs want *Glanceable*, content jobs want *Editorial* or *Immersive Media*.
4. Present the user two anchors with one sentence each and a token preview; build only after a choice.

## The ten anchors

Each recipe gives color, type, shape, density, elevation, motion, signature move and the trap to avoid. Values are starting points to tune against the real content.

### 1. Quiet Utility
For tools, settings-heavy apps, utilities.
- Color: dynamic color on, neutral-forward; primary used only for the main action and selection.
- Type: system font (Roboto Flex/Google Sans where available); `titleLarge` headers, `bodyLarge` content; no display styles.
- Shape: small-medium (8-12dp); full-round only for chips and FAB.
- Density: list-based, 56-72dp rows, dividers or 8dp gaps instead of cards.
- Motion: standard `MotionScheme`, effects springs for state; no hero transitions.
- Signature: perfectly aligned lists with leading icons on a single keyline.
- Trap: so quiet the primary action disappears.

### 2. Tonal Calm (dark-first)
For finance, wellness, night use, AMOLED-friendly brands.
- Color: dark surfaces built from tonal `surfaceContainer*` roles (near-black, never flat `#000` with elevated gray boxes unless OLED pure-black is a deliberate choice); one desaturated accent; semantic colors muted ~20% in dark.
- Type: generous line height, `headline` numbers with tabular figures, secondary text via `onSurfaceVariant` (never alpha-faded primary text).
- Shape: medium-large (12-20dp), consistent everywhere.
- Density: comfortable; 24dp section spacing.
- Elevation: tonal only; no drop shadows on dark.
- Motion: slow effects springs, nothing bouncy on money.
- Signature: one luminous accent element per screen (balance, progress ring) on quiet surfaces.
- Trap: gray-on-gray text below 4.5:1, and "glass" panels that are just low-contrast boxes.

### 3. Expressive Material
For consumer apps that should feel current Android (Material 3 Expressive).
- Color: dynamic color with a richer brand fallback; containers (`primaryContainer`, `tertiaryContainer`) carry emphasis.
- Type: emphasized styles for hero text; larger display/headline contrast between levels.
- Shape: mixed scale used *meaningfully*: bigger/rounder for important or selected items; `MaterialShapes` morph on press/selection.
- Components: `ButtonGroup`, `FloatingToolbar`, `LoadingIndicator`, FAB menu, flexible top app bar where the version supports them.
- Motion: `MotionScheme.expressive()` spatial springs for hero interactions; standard elsewhere.
- Signature: size and shape signal importance; the primary target is identifiable at a glance (the property the CHI'26 study measured).
- Trap: expressiveness everywhere, equal emphasis on everything, bouncy springs on utility flows.

### 4. Editorial
For reading, news, knowledge, recipes, long-form.
- Color: light-first, warm paper neutrals or pure surfaces; accent for links and actions only.
- Type: a characterful serif or contrasting display face for headlines, highly legible body at 16-18sp, 1.5 line height, max ~70 characters per line (two columns or margins on tablets).
- Shape: small (0-8dp); imagery full-bleed or with small radius.
- Layout: strong typographic hierarchy instead of containers; generous whitespace.
- Motion: minimal; crossfades and shared elements for image to detail.
- Signature: the headline is the hero, not a card.
- Trap: tiny captions, justified text without hyphenation.

### 5. Precision Pro
For B2B, analytics, admin, trading, field ops.
- Color: neutral surfaces, one primary, a strict semantic palette with text labels; high contrast scheme ready.
- Type: compact but never below 12sp for data, 14sp for content; tabular numerals; monospace only for codes/IDs.
- Shape: small (4-8dp).
- Density: high; 48dp targets kept via spacing, not shrinking; tables, segmented filters, sticky headers.
- Input: keyboard shortcuts, hover states, context menus on large screens.
- Motion: fast effects springs; no decorative motion.
- Signature: scan-friendly alignment (numbers right-aligned on a decimal keyline).
- Trap: density achieved by shrinking text and targets.

### 6. Immersive Media
For photo, video, music, travel, maps.
- Color: content-derived (palette from artwork) or dark neutral to let media lead; scrims for legibility over images.
- Type: bold, short labels; overlays at `titleMedium`+ with scrim.
- Layout: edge-to-edge, system bars over content, chrome hides on scroll.
- Motion: shared element and container transforms; predictive back previews.
- Signature: content fills the screen; controls appear on demand.
- Trap: text over busy images without a scrim, controls under the gesture area.

### 7. Warm Organic
For food, wellness, lifestyle, small business.
- Color: warm neutrals (cream, clay, sage), earthy accent; avoid pure white/black.
- Type: humanist sans or soft serif headings; relaxed spacing.
- Shape: large and soft (16-28dp), occasional organic `MaterialShapes` for avatars or badges.
- Imagery: real photography, hand-made illustration.
- Motion: gentle effects springs.
- Signature: tactile, friendly surfaces with real photos.
- Trap: low-contrast beige text, decorative blobs everywhere.

### 8. Bold Brand
For apps with a strong existing identity (sports, retail, media brands).
- Color: brand primary as a large field (hero or top region), neutral elsewhere; dynamic color off or harmonized.
- Type: brand display face for headers only, system font for UI.
- Shape: whatever the brand uses, applied consistently.
- Motion: one signature transition reused everywhere.
- Signature: instant recognition from a single screenshot.
- Trap: brand color on every component; failing contrast on brand-colored text.

### 9. Playful
For kids, learning, games-adjacent, habit trackers.
- Color: saturated, multiple accents with clear roles; strong containers.
- Type: rounded display face, large body (16sp+).
- Shape: extra-large, pill and organic shapes; morph on interaction.
- Targets: 56dp+.
- Motion: expressive springs, celebratory moments (completion), always skippable; haptics on success.
- Signature: every success feels rewarded.
- Trap: motion that blocks progress, sensory overload, no reduced-motion fallback.

### 10. Glanceable
For widgets, Wear OS, car, ambient, quick-status apps.
- Color: high contrast, few colors, meaning-coded with icons and text.
- Type: large, short; one number or status dominates.
- Layout: single focal point, no scrolling needed for the key fact.
- Motion: none or minimal; battery-aware.
- Signature: understandable in one second at arm's length.
- Trap: shrinking a phone screen into a widget.

## Mixing and tuning

- Combine at most two: a **base** (layout, density, type) and an **accent** (color or motion). Example: *Precision Pro* base + *Tonal Calm* color for a dark trading app.
- `bolder` moves along: color fields, display type, larger shapes, expressive motion. `quieter` moves back: neutral surfaces, smaller type contrast, standard motion. Change one axis at a time and re-render.
- Dark-only, light-only or both is a product decision; default to supporting both plus dynamic color unless the brand forbids it.

## Writing the anchor into DESIGN.md

```
Anchor: Tonal Calm (base) + Precision Pro (data density)
Because: finance register, daily operators, frequent night use
Allowed: tonal surfaces, one teal accent, tabular numerals, 12dp radius
Not allowed: gradients, glass, shadows on dark, animated balances
```
Use [DESIGN_TEMPLATE.md](../../assets/DESIGN_TEMPLATE.md).

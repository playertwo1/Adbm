# Anti-slop: what makes Android UI look AI-generated

These patterns come from shared defaults in templates and training data. Each one is not always wrong, but together they say "nobody decided anything". Check every screen before calling it done. Lint rule ids from `ui_audit.py lint` are in brackets.

## Contents
- Color and surfaces
- Layout and structure
- Typography and copy
- Components and interaction
- Motion
- The 30-second squint test

## Color and surfaces

| Slop | Why it fails | Do instead |
|---|---|---|
| Baseline M3 purple `#6750A4` shipped as the brand [D010] | It is the template sample color; signals "default" | Dynamic color, or a seed from the real brand through Material Theme Builder |
| Purple-to-blue or rainbow gradients on heroes and buttons [D005] | Decoration without meaning, hurts contrast on text | Flat tonal containers; gradients only for real meaning (heat, time) |
| Hex literals sprinkled in screens [C001] | Breaks dark theme, contrast levels and dynamic color | Theme roles or extended tokens |
| Gray text by alpha (`onSurface.copy(alpha = 0.5f)`) [C004] | Unpredictable contrast on every surface | `onSurfaceVariant` or a defined secondary role, checked to 4.5:1 |
| Flat `#000000` background with `#1E1E1E` boxes | Harsh, smeary on OLED scroll, cheap look | Tonal `surface`/`surfaceContainer*` ramp; pure black only as deliberate OLED mode |
| Glassmorphism by default [P004] | Low contrast, expensive blur, rarely fits Android | Solid tonal surfaces; scrims over media |
| Drop shadows on everything [D003] | Muddy on dark, inconsistent light source | Tonal elevation; shadows only for floating elements |

## Layout and structure

| Slop | Why it fails | Do instead |
|---|---|---|
| Everything in a `Card`, cards inside cards [D002] | Adds borders and padding without hierarchy | Lists, dividers, spacing and headings; a card only for a self-contained, actionable unit |
| "Welcome back, User!" hero eating the first viewport | Wastes the most valuable space | Put the job's key fact and primary action above the fold |
| Three-icon feature grid / stat tiles of equal weight | No hierarchy; nothing is primary | One dominant item, supporting items smaller |
| Everything centered | Hard to scan, wastes width | Start-aligned content on a keyline; center only short, isolated moments |
| Random spacing (5, 7, 13, 18dp) [D006] | Visual jitter | 4dp grid with a named spacing scale |
| Phone layout stretched on a tablet [L006] | Lines too long, huge empty gaps | Window size classes, panes, max content width |
| FAB that duplicates a visible button | Two primaries | One primary action per screen |

## Typography and copy

| Slop | Why it fails | Do instead |
|---|---|---|
| One weight, one size, everywhere | Flat hierarchy | Type roles with at least three clear levels |
| Hard-coded `fontSize` in screens [T003] | Breaks the scale and theming | `MaterialTheme.typography.*` |
| 10-11sp captions for real information [T001] | Illegible outdoors and for many users | 12sp minimum for data, 14sp for content |
| ALL CAPS buttons [T004] | Shouting, worse readability, M2 relic | Sentence case labels |
| Emoji as icons [D004] | Inconsistent rendering, not themeable | Material Symbols |
| "Lightning fast", "Powered by AI", "Oops! Something went wrong" | Empty claims, unhelpful errors | Specific, verb-first, recovery-oriented copy ([content-and-copy.md](../05-components/content-and-copy.md)) |
| Lorem ipsum and perfect short names in mocks | Hides overflow bugs | Real or worst-case content: long names, 9-digit numbers, translations |

## Components and interaction

| Slop | Why it fails | Do instead |
|---|---|---|
| Full-screen spinner for every load | Blocks, feels slow | Skeleton for layout, keep stale content, inline progress |
| Toast for errors | Missed, not accessible enough, no action | Inline error or Snackbar with action |
| Dialog to confirm every action | Friction | Undo via Snackbar; confirm only destructive and irreversible |
| Tiny `IconButton`-less icons with `clickable` [A003] | Targets under 48dp, no ripple bounds | `IconButton` or `minimumInteractiveComponentSize()` |
| Swipe-only actions | Undiscoverable, inaccessible | Visible action plus `customActions` |
| Bottom bar + top bar + FAB + tabs on one phone screen | Chrome over content | Choose the minimum navigation set |

## Motion

| Slop | Why it fails | Do instead |
|---|---|---|
| Everything fades and slides in on first load | Delays content, feels like a template | Animate state changes, not existence |
| Long tweens (500ms+) [P005] | Feels sluggish | Theme springs; effects fast, spatial default |
| Infinite ambient animation on primary screens [P003] | Distracting, battery, a11y | Static, or animate once with purpose |
| Bouncy springs on serious data | Feels unreliable | Standard scheme, no overshoot on numbers |

## The 30-second squint test

Render the screen, blur your eyes (or downscale to 25%) and answer:
1. What is the first thing you see? Is it the job's primary item?
2. Can you tell the primary action from secondary ones?
3. Are there more than three visual weights competing?
4. Would someone recognize this product from this screenshot without the logo?

Two "no" answers means the direction is not done; go back to [aesthetic-anchors.md](aesthetic-anchors.md).

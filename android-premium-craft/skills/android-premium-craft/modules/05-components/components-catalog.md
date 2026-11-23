# Components catalog

Pick the component by job, then use it as designed. Reuse the project's own components first.

## Contents
- Actions
- Containers and surfaces
- Selection and input controls
- Feedback and progress
- Lists and collections
- Expressive components (version-gated)

## Actions

| Component | Use | Misuse |
|---|---|---|
| Filled button | The single primary action of a screen or section | Two filled buttons side by side |
| Filled tonal button | Important secondary action, or primary in calm UIs | Destructive actions without error color |
| Outlined button | Secondary action next to a primary | Primary action |
| Text button | Low-emphasis actions, dialog actions | Standalone main CTA |
| Icon button | Compact actions with a well-known icon + `contentDescription` | Obscure icons without labels |
| FAB / extended FAB | The screen's most common creative action | Navigation, destructive actions, duplicate of a visible button |
| Split button (Expressive) | Primary action + variants menu | Unrelated actions |
| Button group / connected buttons (Expressive) | Related actions or single-select options with shape feedback | Long labels that wrap |

Button hierarchy per region: one high-emphasis, the rest lower. Labels: verb first, sentence case, 1-3 words ("Pay invoice", not "OK"). Minimum height 40dp visual, 48dp touch.

## Containers and surfaces

| Component | Use | Notes |
|---|---|---|
| Card (filled/outlined/elevated) | Self-contained, actionable unit | Whole card clickable *or* inner buttons, not both without clear areas |
| Bottom sheet (modal) | Contextual actions/details on compact | Drag handle, back dismisses, does not hide the IME-needed field |
| Side sheet | Same on expanded widths | |
| Dialog | Short decisions that block: destructive confirm, permission rationale | No forms longer than 2-3 fields; title states the question |
| Full-screen dialog | Complex creation on compact | Close and save in top bar |
| Tooltip / rich tooltip | Explain an icon or term | Not for essential info |

## Selection and input controls

| Component | Use |
|---|---|
| Switch | Immediate on/off settings |
| Checkbox | Multi-select, or a setting applied on save |
| Radio button | Single choice among 2-5 visible options |
| Segmented button | 2-5 view/filter options |
| Chips (filter/input/assist/suggestion) | Filters, entered tokens, smart actions |
| Slider / range slider | Approximate values; show the value and offer text entry for precise values |
| Date/time pickers | Material pickers; allow keyboard entry mode |
| Dropdown menu (exposed) | Single choice among many |

Every control exposes role and state to TalkBack (Material components do; custom ones need `semantics` / `toggleable(role = Role.Switch)`).

## Feedback and progress

| Component | Use |
|---|---|
| Snackbar | Brief result, optional single action (Undo, Retry); not for critical errors |
| Inline error / supporting text | Field and section errors |
| Banner (custom) | Persistent condition (offline, account issue) with action |
| Linear / circular progress | Determinate when progress is known; indeterminate otherwise |
| `LoadingIndicator` (Expressive) | Short indeterminate waits with brand character |
| Skeleton (custom) | First load of structured content |

## Lists and collections

- `ListItem` for standard rows; consistent leading element type per list.
- Swipe actions need visible alternatives and `customActions`.
- Selection mode: long-press enters, top bar shows count and bulk actions, back exits.
- Reordering: drag handle + accessible move up/down actions.

## Expressive components (version-gated)

`ButtonGroup`, `SplitButton`, `FloatingToolbar`, FAB menu, `LoadingIndicator`, wide navigation rail, flexible app bars and shape morphing arrived with Material 3 Expressive and are mostly experimental in Compose Material 3 1.4/1.5. Use them when the project version has them and the anchor calls for it; otherwise express the same intent with standard components plus theme springs and shape tokens.

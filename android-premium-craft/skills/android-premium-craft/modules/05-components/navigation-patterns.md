# Navigation patterns

## Contents
- Choosing the structure
- Top app bars
- Tabs, segmented buttons and chips
- Back and predictive back
- State and deep links
- Anti-patterns

## Choosing the structure

| Need | Pattern |
|---|---|
| 3-5 peer top-level destinations | Navigation bar (compact) / rail (wider) via `NavigationSuiteScaffold` |
| 2 destinations | Tabs or a segmented button, not a bar |
| 6+ destinations or rare ones | Drawer (modal on compact) or "More" destination; reconsider the IA first |
| Linear task | No persistent navigation; top app bar with up/close and a progress indicator |
| Content hierarchy | List-detail; up navigation returns to the list |

Rules: every top-level destination has an icon **and** a label; selected state uses the indicator and filled icon; badges only for actionable counts; the bar does not change items per screen.

## Top app bars

- Small/center-aligned for most screens; medium/large (collapsing) for content screens where the title adds context and there is a long scroll.
- Max two or three action icons; overflow menu for the rest. Primary action belongs to a button or FAB, not an app bar icon.
- Search: `SearchBar`/docked search on wider screens; the result list replaces content, back clears search first.
- Expressive alternatives where available: flexible top app bar for hero titles, `FloatingToolbar` for contextual actions on content.

## Tabs, segmented buttons and chips

- Tabs switch views of the same content level; swipe between tabs only if no conflicting horizontal gestures inside.
- Segmented buttons: 2-5 options, short labels, for filters or view modes.
- Filter chips for multi-select filters; assist chips for smart suggestions; never chips as primary navigation.

## Back and predictive back

- Apps targeting SDK 36 get predictive back system animations by default; `onBackPressed()` is no longer called [lint N001] and `KEYCODE_BACK` is not dispatched [N002].
- Use the navigation library's built-in back handling (Navigation 2.8+/Navigation 3 support predictive back). For custom interception: `BackHandler`/`PredictiveBackHandler` in Compose, or the newer `NavigationEvent` APIs (`NavigationBackHandler`, SDK 36+; follow the official `navigation-event` skill).
- Intercept back only for real reasons: unsaved input (offer discard/keep), closing an in-screen layer (sheet, search, selection mode). Never trap the user at the root.
- Predictive back previews the destination: in-screen layers (sheets, expanded search, side panes) should animate with the gesture progress, and cancelling must restore state exactly.
- `android:enableOnBackInvokedCallback="false"` [N004] is a temporary escape hatch, not a fix.

## State and deep links

- Each top-level destination keeps its own back stack and scroll position.
- Deep links land on a screen with correct up/back behavior (synthesized back stack).
- Process death: restore the destination, the selection and drafts (`SavedStateHandle`, `rememberSaveable`).

## Anti-patterns

- Hamburger menu as the only navigation on phones with few destinations.
- Bottom bar on every screen including linear flows and detail screens.
- Custom back arrows that do something different from system back.
- Two navigation systems competing (bar + drawer + tabs) on one compact screen.

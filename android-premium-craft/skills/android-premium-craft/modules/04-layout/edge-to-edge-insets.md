# Edge-to-edge and insets

Edge-to-edge is enforced for apps targeting SDK 35 on Android 15+, and the opt-out is gone at SDK 36. For a full migration follow the official `edge-to-edge` skill; this module is the design and review view.

## Contents
- Design intent
- Implementation rules (Compose)
- IME and forms
- Cutouts, gestures and system bars
- Views
- Checks

## Design intent

- Backgrounds, app bars and media draw behind the system bars; **interactive and readable content stays inside safe insets**.
- Lists scroll under the navigation bar with bottom `contentPadding`, so the last item is fully visible above it.
- Gesture navigation: bottom bars sit above the gesture handle; nothing tappable in the bottom gesture area or the side back-gesture zones unless excluded deliberately.

## Implementation rules (Compose)

1. `enableEdgeToEdge()` before `setContent` in every Activity.
2. Apply insets **once**. Preferred: `Scaffold` and pass its `innerPadding` to the content (`contentPadding` for lazy lists plus `consumeWindowInsets(innerPadding)`). Ignoring `innerPadding` [lint L001] or adding `systemBarsPadding()` on top of it causes overlaps or double padding.
3. Material 3 app bars, navigation bar/rail, drawers and bottom sheets handle their own insets; do not pad their parent.
4. For custom layouts use `WindowInsets.safeDrawing`, `safeContent` (includes gesture areas) or specific types (`statusBars`, `navigationBars`, `ime`, `displayCutout`) via `windowInsetsPadding`.
5. `statusBarColor`/`navigationBarColor` are ignored on Android 15+ [lint L002]. Control icon contrast with `enableEdgeToEdge(statusBarStyle = SystemBarStyle.auto(...))`.
6. Drop Accompanist System UI Controller / Insets [lint L007]; they are deprecated.

## IME and forms

- `android:windowSoftInputMode="adjustResize"` and `Modifier.imePadding()` (or `contentWindowInsets` in Scaffold) on the scrolling container so the focused field and the primary action stay visible.
- Bring the focused field into view (`BringIntoViewRequester` happens automatically for text fields inside scrollable containers; verify).
- Long forms: the submit button scrolls with content or sits above the IME, never hidden under it.

## Cutouts, gestures and system bars

- Landscape cutouts: pad content with `displayCutout` insets; keep media full-bleed.
- Custom horizontal swipe (carousels, drawers) near screen edges conflicts with back gesture; keep swipe areas away from edges or use `Modifier.systemGestureExclusion()` sparingly (limited to 200dp height per edge).
- Immersive mode (video, camera, games) via `WindowInsetsControllerCompat.hide(...)` with `BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE`; restore on exit.
- Three-button navigation is opaque/translucent by system default; check the bottom area in both navigation modes.

## Views

`WindowCompat.enableEdgeToEdge(window)` or `EdgeToEdge.enable(activity)`, then `ViewCompat.setOnApplyWindowInsetsListener` on the right views (padding for scrolling containers with `clipToPadding=false`, margins for FABs). `fitsSystemWindows` only on the views meant to absorb insets.

## Checks

- [ ] Gesture and three-button navigation (`device_matrix.py --profiles nav`)
- [ ] Landscape with cutout
- [ ] Keyboard open on every field, focused field and primary action visible
- [ ] Last list item fully visible above nav bar
- [ ] Status bar icons legible on light and dark content
- [ ] No double padding (measure top/bottom gaps in a screenshot)

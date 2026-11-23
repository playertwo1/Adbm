# Adaptive layouts

Tablets, foldables, Chromebooks, desktop windowing and multi-window are normal Android. From SDK 36 (no opt-out at 37) large screens ignore orientation and resizability locks. For implementation details follow the official `adaptive` skill; this module covers decisions.

## Contents
- Window size classes
- Navigation by width
- Pane strategies
- Content that adapts
- Postures and input devices
- Continuity
- Checks

## Window size classes

Decide by **window** size, never device model or screen pixels.

| Width class | dp | Typical device state |
|---|---|---|
| Compact | < 600 | Phone portrait |
| Medium | 600 - 839 | Tablet portrait, unfolded foldable portrait |
| Expanded | 840 - 1199 | Tablet landscape, desktop window |
| Large | 1200 - 1599 | Large tablet, desktop |
| Extra-large | >= 1600 | Desktop, external display |

Height classes (compact < 480, medium 480-899, expanded >= 900) matter for landscape phones: compact height means no tall heroes and no bottom sheets that cover everything. Read with `currentWindowAdaptiveInfo().windowSizeClass` (material3-adaptive). The large/extra-large breakpoints need a recent adaptive library version; verify.

## Navigation by width

| Width | Navigation |
|---|---|
| Compact | Navigation bar (3-5 destinations) |
| Medium | Navigation rail (collapsed); bar acceptable in portrait |
| Expanded+ | Navigation rail (expanded/wide rail) or permanent drawer |

`NavigationSuiteScaffold` switches automatically. Keep destination order and icons identical across forms.

## Pane strategies

- **List-detail**: one pane on compact (detail navigates), two panes from medium/expanded. Selection is visible in the list when both show.
- **Supporting pane**: main content plus tools/filters/related info; becomes a bottom sheet or separate screen on compact.
- **Feed**: increase columns, not item size. `GridCells.Adaptive(minSize = 160.dp..320.dp)`.
- Pane widths: list pane 360-412dp fixed, detail flexible; spacer 24dp. Allow a drag handle to resize where the library supports it.
- Full-screen detail on phones must not stay full-screen on tablets.

## Content that adapts

- Constrain reading width (~640dp) and form width (~560dp); center or split the rest, do not stretch text lines across 1200dp.
- Images: switch aspect ratios or crop focal points per width.
- Dialogs become larger centered surfaces; bottom sheets may become side sheets on expanded widths.
- Use `BoxWithConstraints`/`Modifier.layout` for component-level decisions (a card that becomes horizontal when wide). Newer experimental Compose `MediaQuery`, `Grid` and `FlexBox` APIs can express this more directly; check the version gate in [project-recon.md](../01-discover/project-recon.md).

## Postures and input devices

- Foldables: tabletop (half-opened horizontal hinge) puts content top, controls bottom; book posture splits at the hinge. Never place critical content across a hinge (`WindowInfoTracker` / adaptive library posture info).
- Keyboard: Tab order, Enter to submit, shortcuts for frequent actions on large screens (`onPreviewKeyEvent`), visible focus indicators.
- Mouse/trackpad: hover states (`hoverable`, M3 components handle it), right-click context menus, scroll wheel on lists, pointer icon changes for links/text.
- Stylus: handwriting in text fields works by default in Compose text fields on supported devices; do not block it.

## Continuity

- Activity is recreated on resize unless handled; state must survive (`rememberSaveable`, ViewModel). In Compose-only activities, handling `screenSize|smallestScreenSize|screenLayout|orientation` config changes lets the UI recompose instead of recreate; then every value derived from configuration must be read in composition.
- Folding/unfolding keeps the user's place: same item selected, same scroll offset, same draft.

## Checks

- [ ] Render previews with `@PreviewScreenSizes` (phone, foldable, tablet, desktop) and landscape phone
- [ ] Resize the window continuously (desktop windowing or emulator resizable device) without crashes or state loss
- [ ] Navigation switches bar/rail correctly and keeps the selected destination
- [ ] No text line wider than ~75 characters on expanded widths
- [ ] Keyboard-only and mouse pass on one critical flow

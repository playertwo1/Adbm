# Accessibility

Accessible is part of premium: the same screen must work for TalkBack, Switch Access, Voice Access, keyboard, 200% text, low vision and motor impairments. Verify behavior, not code tokens.

## Contents
- Targets and touch
- Semantics recipes (Compose)
- Focus, order and keyboard
- Text and color
- Gestures and alternatives
- Manual test scripts
- Automated checks
- Status vocabulary

## Targets and touch

- Interactive area >= 48x48dp, independent of the visual size. Material components enforce it via `minimumInteractiveComponentSize()`; custom clickables need it or `sizeIn(minWidth = 48.dp, minHeight = 48.dp)` [lint A003].
- At least 8dp between adjacent targets, or merged into one larger target.
- Make the whole row clickable rather than a small trailing icon when the row has one action.
- Kids/field/elderly registers: 56dp+.

## Semantics recipes (Compose)

```kotlin
// Row with one action: clickable already merges its children; name the action
Row(Modifier.clickable(onClickLabel = "Open invoice", role = Role.Button) { open() }) { /* texts */ }

// Non-clickable group that should read as one unit
Column(Modifier.semantics(mergeDescendants = true) { }) { /* label + value */ }

// Icon-only button
IconButton(onClick = onSearch) { Icon(Icons.Rounded.Search, contentDescription = "Search") }

// Custom toggle exposes role + state
Modifier.toggleable(value = on, role = Role.Switch, onValueChange = onToggle)

// Heading for navigation by headings
Text("Payments", style = MaterialTheme.typography.titleLarge, modifier = Modifier.semantics { heading() })

// State that is not visible as text
Modifier.semantics { stateDescription = if (expanded) "Expanded" else "Collapsed" }

// Swipe/long-press alternatives
Modifier.semantics { customActions = listOf(CustomAccessibilityAction("Archive") { archive(); true }) }

// Dynamic content announcements
Modifier.semantics { liveRegion = LiveRegionMode.Polite }

// Decorative content
Icon(Icons.Rounded.Star, contentDescription = null)
Modifier.clearAndSetSemantics { contentDescription = "Rating 4.5 of 5" } // replace children with one description
```

- `contentDescription` names purpose; `onClickLabel` names the action ("Double tap to *open invoice 34*").
- Group related text with `mergeDescendants = true` so cards read as one unit, not five fragments.
- Traversal: `isTraversalGroup = true` on containers and `traversalIndex` to fix reading order in complex layouts (e.g., overlapping FAB, custom grids).
- Views: `contentDescription`, `labelFor`, `accessibilityHeading`, `stateDescription`, `ViewCompat.addAccessibilityAction`, `importantForAccessibility="no"` for decoration.

## Focus, order and keyboard

- Reading order follows visual priority: title, key fact, primary action, details.
- After navigation, focus starts at the top (title); after a dialog closes, focus returns to the trigger.
- Keyboard/D-pad: everything reachable with Tab/arrows, visible focus indicator (Material provides; custom components need `indication` for focus or `onFocusChanged` styling), no focus traps, Esc/back closes layers.
- `FocusRequester` only for deliberate moves (first invalid field on submit), never to steal focus on load.

## Text and color

- Text scales to 200% (Android 14 nonlinear) with no clipping or overlap; see [typography.md](../03-system/typography.md).
- Contrast 4.5:1 text, 3:1 non-text essential graphics ([color.md](../03-system/color.md)).
- Meaning never by color alone: add icon, text, pattern or position.
- Respect bold text (Android 12+ font weight adjustment) and high-contrast text settings; do not hard-code font weights that fight them.

## Gestures and alternatives

- Every gesture (swipe, drag, long-press, pinch, multi-finger) has a visible control or custom action alternative.
- Drag-to-reorder: also offer "Move up/Move down" actions.
- Timeouts (Snackbars, auto-advancing carousels) extend or pause when TalkBack is on (`AccessibilityManager.getRecommendedTimeoutMillis`); carousels have pause controls.

## Manual test scripts

Run on the critical flow, record results as evidence.

1. **TalkBack**: swipe through the whole screen. Every element announces name + role + state; order matches the visual; no unlabeled buttons; cards read as units; the primary action is reachable in few swipes; dialogs trap focus correctly and release on close.
2. **200% text + largest display size**: nothing clipped, overlapping or truncated without a way to read it; primary action reachable.
3. **Switch Access / keyboard**: complete the flow without touch.
4. **Voice Access**: say "Tap <visible label>" for each action; labels match.
5. **Grayscale / color correction**: all statuses still distinguishable.
6. **Remove animations**: the flow is understandable.

## Automated checks

- Compose UI tests (ui-test 1.8+): enable accessibility checks on the test rule (`enableAccessibilityChecks()`) and run `tryPerformAccessibilityChecks()` on relevant nodes; verify the exact API and artifact in the linked docs for the project's version. Template: [A11yCheckTest.kt](../../assets/compose/A11yCheckTest.kt).
- Espresso: `AccessibilityChecks.enable()` (Accessibility Test Framework).
- Screenshot tools with ATF integration (Roborazzi/Paparazzi accessibility options) for broad coverage.
- Accessibility Scanner app for manual exploratory scans.
- Semantics assertions in tests: `onNodeWithContentDescription("Search").assertHasClickAction()`, `assert(hasStateDescription("Expanded"))`.
- `ui_audit.py lint` A-rules are code leads only.

## Status vocabulary

`not-run` | `automated-pass` (tool found no issues) | `manual-pass` (human/agent ran the script on device) | `fail`. Automated checks never substitute for the TalkBack script.

Sources: developer.android.com/develop/ui/compose/accessibility (semantics, testing, api-defaults), Android 14 nonlinear font scaling docs.

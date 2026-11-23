# States and feedback

A screen is the sum of its states. Model them in `UiState` first, then design each one.

## Contents
- The state inventory
- Loading
- Empty
- Error and offline
- Success, undo and confirmation
- Touch feedback and haptics
- Permissions

## The state inventory

For every screen list which apply and design each:

| State | Design question |
|---|---|
| First load | What can show instantly (cache, skeleton, static chrome)? |
| Content | Short, typical and worst-case content (long names, 0 items, 10k items) |
| Refreshing | Is old content kept visible while refreshing? |
| Empty (first use) | What should the user do first? |
| Empty (filtered/search) | How do they clear or change the filter? |
| Partial / degraded | Some sections failed: show what loaded, mark what did not |
| Error (recoverable) | What happened, what to do, retry |
| Offline / stale | When was data last updated? What still works? |
| Permission denied | What is lost, how to grant, how to continue without |
| Disabled / read-only | Why is it disabled? |
| Pending action | Optimistic UI with pending marker, or progress on the control |

Previews per state (`@PreviewParameter` with a `UiState` provider) make them reviewable and testable; see [CraftPreviews.kt](../../assets/compose/CraftPreviews.kt).

## Loading

- 0-300 ms: show nothing extra (avoid flicker). Delay indicators ~300 ms.
- First load of structured content: skeleton shaped like the real layout, using surface tones, with a subtle shimmer or none (respect reduced motion).
- Refresh: keep content, show inline progress (pull indicator, linear progress under the app bar).
- Actions: progress inside the button or the item that triggered it; keep the rest usable.
- Long tasks (> 10 s): determinate progress, explain, allow leaving the screen (WorkManager + notification).
- Announce completion for TalkBack when content replaces a loading state (`liveRegion = LiveRegionMode.Polite` on the container or an announcement).

## Empty

Formula: **what this place is for + one action to fill it**. "No invoices yet. Create your first invoice to get paid faster. [Create invoice]". Filtered empty: "No results for 'tax'" + [Clear filters]. Keep illustration small; the action must be visible at 200% text.

## Error and offline

- Inline, close to what failed; full-screen error only when nothing can be shown.
- Copy: what happened (plain words), why if known, what to do. Offer Retry; preserve user input.
- Offline: banner or app bar subtitle "Offline - showing data from 14:32"; disable only actions that need network; queue the rest.
- Never show stack traces, error codes alone, or "Oops!".

## Success, undo and confirmation

- Prefer **undo** (Snackbar with action, ~4-10 s, longer with TalkBack on) over confirmation dialogs.
- Confirm only destructive and irreversible actions; the confirm button names the action ("Delete 3 files"), uses error color.
- Success for important actions: inline state change plus brief Snackbar; celebration only where the register allows (Playful anchor).

## Touch feedback and haptics

- Every touchable shows a pressed state immediately (ripple/indication or shape/scale change) - within the same frame, before any network work.
- Selected and focused states are distinct from pressed.
- Haptics: favor crisp, clear effects; consistent per action type; never on every scroll or tap.
  - Compose: `LocalHapticFeedback.current.performHapticFeedback(HapticFeedbackType.X)`. Compose 1.8+ adds types like `Confirm`, `Reject`, `ToggleOn`, `ToggleOff`, `SegmentTick`, `GestureThresholdActivate`, `ContextClick`, `VirtualKey`, `LongPress`.
  - Views: `view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)` (and `REJECT`, `TOGGLE_ON`, `SEGMENT_TICK`, `GESTURE_START`, ...).
  - Map: toggle -> ToggleOn/Off; slider detents -> SegmentTick; swipe-to-dismiss threshold -> GestureThresholdActivate; success/failure -> Confirm/Reject; long-press -> LongPress.
  - Respect the system touch-feedback setting (predefined constants do).
- Sound: only for media, games, kids, or explicit confirmation contexts.

## Permissions

- Ask in context, right before the feature needs it, with a one-line rationale on the UI that triggers it.
- If denied: the feature degrades gracefully with an explanation and a path to Settings; never loop the prompt.
- Prefer permissionless APIs: Photo Picker, document picker, Credential Manager, approximate location.

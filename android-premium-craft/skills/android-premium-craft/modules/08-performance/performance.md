# Performance: perceived and measured

Smoothness is part of the visual quality. For deep Compose optimization follow the official `jetpack-compose-performance` skill; this module sets the method and the UI-level rules.

## Contents
- Perceived performance
- Compose rules that matter for UI work
- Startup
- Measuring honestly
- Budgets
- Report format

## Perceived performance

- Respond to touch in the same frame (pressed state), show the result optimistically when safe, and keep old content during refresh.
- Render the shell instantly (cached data, skeleton), then fill.
- Avoid layout shifts: reserve image and async content space.
- Prefetch the next likely screen's data; lazy lists prefetch items by default.
- A fast app with a modest design feels more premium than a beautiful app that stutters.

## Compose rules that matter for UI work

- Stable `key` for lazy items (`items(list, key = { it.id })`) [lint P001] and `contentType` for heterogeneous lists.
- Read fast-changing state as late as possible: lambda modifiers (`Modifier.offset { }`, `graphicsLayer { }`, `drawBehind { }`) instead of passing values through composition.
- `derivedStateOf` for values derived from frequently changing state (scroll position -> "show FAB").
- Hoist heavy work out of composition (formatting large lists, sorting, parsing) into the ViewModel or `remember(keys)`.
- `collectAsStateWithLifecycle()` instead of `collectAsState()` on Android [lint P002].
- Images sized to the display size; no full-resolution bitmaps in lists.
- Release builds with R8 for any judgment; debug builds can be several times slower.
- Do not chase stability annotations before measuring; strong skipping (default in recent Compose compilers) already removes most issues.

## Startup

- Splash only until the first meaningful frame; no artificial delays.
- Baseline Profiles (and Startup Profiles) for cold start and the main scroll journeys; measure the gain.
- Defer non-critical initialization (analytics, remote config) off the critical path.

## Measuring honestly

Performance is a property of **device + build + flow + data**. Compare only like with like.

1. Pick the journey (cold start, scroll feed, open detail).
2. Release or `profileable` build, same device, same data, charger state noted, animations at 1x.
3. Baseline: Macrobenchmark (`StartupTimingMetric`, `FrameTimingMetric`), 5+ iterations; note median and P90/P95.
4. Change one thing.
5. Re-measure with identical settings. Report the delta with variance.
6. Diagnose with Perfetto/System Trace or Android Studio Profiler; production signal from Android vitals and JankStats.

## Budgets

| Display | Frame period |
|---|---|
| 60 Hz | ~16.7 ms |
| 90 Hz | ~11.1 ms |
| 120 Hz | ~8.3 ms |

Targets to aim for (not guarantees): no frozen frames (> 700 ms), slow-frame rate low on the critical scroll, touch-to-visual feedback within one frame, cold start that shows meaningful content quickly on a mid-range device. Never report FPS from visual impression.

## Report format

Illustrative numbers; report only what you measured.

```
Journey: scroll Transactions (200 items), Pixel 7a, release+R8, Android 16
Baseline: frameDurationCpuMs P50 6.1 / P90 11.8; frameOverrunMs P90 2.4 (5 runs)
Change: stable keys + contentType, moved date formatting to ViewModel
After:    frameDurationCpuMs P50 4.9 / P90 8.7; frameOverrunMs P90 -1.1 (5 runs)
Status: measured. Not measured: low-end device, cold start.
```

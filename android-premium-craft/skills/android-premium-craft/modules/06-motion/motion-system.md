# Motion system

Motion is premium when the user never waits for it and always understands it.

## Contents
- Purpose test
- Springs from the theme
- Choosing the API
- Transitions between screens
- Choreography
- Reduced motion
- Performance guardrails
- Review checklist

## Purpose test

Every animation must do at least one of:
1. **Acknowledge** input (press, toggle, drag response).
2. **Explain** a state change (expand, reorder, add/remove).
3. **Preserve context** across navigation (shared element, container transform, predictive back preview).
4. **Express character** at a key moment (completion, onboarding hero) - rare, skippable.

No purpose -> remove it. Animations never delay input; the user can act during and interrupt any animation.

## Springs from the theme

Material 3 motion is physics-based: **spatial** springs (position, size, shape, may overshoot slightly) and **effects** springs (color, alpha, no overshoot), each in fast, default and slow.

```kotlin
val spatial = MaterialTheme.motionScheme.defaultSpatialSpec<Dp>()
val effects = MaterialTheme.motionScheme.fastEffectsSpec<Color>()
val width by animateDpAsState(if (expanded) 280.dp else 120.dp, spatial, label = "width")
```

- `MotionScheme.standard()` for utility flows; `MotionScheme.expressive()` for hero interactions (expressive API, verify version).
- Without `motionScheme` access, use `spring(dampingRatio = Spring.DampingRatioNoBouncy, stiffness = Spring.StiffnessMediumLow)` for effects and a slightly bouncy ratio (~0.8) for spatial moves; avoid long `tween`s (>= 500 ms flagged by lint P005).
- Springs are interruptible and velocity-preserving; prefer them for anything gesture-driven.

## Choosing the API (Compose)

| Need | API |
|---|---|
| One value follows state | `animate*AsState` |
| Several values per state | `updateTransition` |
| Appear/disappear | `AnimatedVisibility` (with `enter`/`exit` built from theme specs) |
| Swap content | `AnimatedContent` with `contentKey` and `SizeTransform` |
| Size changes of a container | `Modifier.animateContentSize()` |
| List item add/remove/move | `Modifier.animateItem()` inside lazy lists (requires stable keys) |
| Gesture-driven value | `Animatable` + `animateTo`/`snapTo`, `AnchoredDraggable` |
| Screen-to-screen continuity | `SharedTransitionLayout` + `sharedElement`/`sharedBounds` (check opt-in for the version) |
| Draw-only effects | `graphicsLayer { }` lambda / `drawBehind` to skip recomposition and layout |

Views: `MaterialContainerTransform`, `MaterialSharedAxis`, `MaterialFadeThrough` (MDC transitions), `SpringAnimation` (dynamicanimation).

## Transitions between screens

- Forward/back in a hierarchy: shared axis (X) or container transform from the tapped element.
- Between top-level destinations: fade through (no spatial relationship).
- List to detail: container transform or shared element on the image/title.
- Predictive back: let the navigation library run the system/back preview; custom layers follow `BackEventCompat.progress`.
- Keep durations perceptually short: most UI transitions settle in roughly 200-400 ms; large surfaces may take longer but must stay interruptible.

## Choreography

- One focal motion at a time; secondary elements follow with small stagger (20-40 ms) or simply fade.
- Enter with deceleration, exit faster than enter.
- Motion direction matches spatial model (sheets come from the edge they live on).
- Do not animate the first render of a screen just to "make it alive".

## Reduced motion

- Users disable or scale animations (`Settings.Global.ANIMATOR_DURATION_SCALE`, "Remove animations"). Compose animations follow the animator scale; at 0 they jump to the end. Make sure the end state is fully understandable without the motion.
- Replace large spatial motion with crossfades when animations are reduced; stop infinite and parallax effects entirely.
- Test with `device_matrix.py --profiles motion` (sets animator scales to 0, then restores).

## Performance guardrails

- Animate in the draw phase when possible (`graphicsLayer { alpha = ...; translationX = ... }` with lambda reads).
- Avoid animating layout of large subtrees every frame; avoid `Modifier.blur` and big alpha layers on scrolling content.
- No per-item infinite animations in lazy lists; no animation on every scroll-into-view.
- Measure jank on a release build with Macrobenchmark `FrameTimingMetric` before claiming smoothness ([performance.md](../08-performance/performance.md)).

## Review checklist

- [ ] Each animation passes the purpose test
- [ ] Input is accepted during animations; interrupting does not glitch
- [ ] Uses theme springs or justified specs; no >= 500 ms tweens without reason
- [ ] Reduced motion end states are clear
- [ ] Shared/predictive back transitions cancel cleanly
- [ ] No jank on a mid-range device (measured if claimed)

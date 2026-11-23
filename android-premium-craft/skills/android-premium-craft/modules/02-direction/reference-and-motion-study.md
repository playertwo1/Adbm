# References and motion studies

Use references to extract **principles** (hierarchy, density, rhythm, motion intent), never to copy artwork, trade dress or trademarks.

## Contents
- Intake and rights
- Reading a static reference
- Motion study from a recording
- Implementation classes
- Validating against the reference

## Intake and rights

- Accept: the user's own screenshots and recordings, public screenshots for analysis, official Google samples (Now in Android, Compose samples), Material 3 docs, the user's Figma/Stitch exports.
- Ask for the permitted use of any third-party material. Keep recordings local; redact personal, customer or company data before anything leaves the workstation.
- Fill [REFERENCE_BRIEF_TEMPLATE.md](../../assets/REFERENCE_BRIEF_TEMPLATE.md).

## Reading a static reference

Extract, in this order, and write one line each:
1. **Attention order**: what is seen 1st, 2nd, 3rd, and why (size, color, position, contrast).
2. **Grid**: margins, keylines, columns, gutter, spacing rhythm (measure in dp at the reference density).
3. **Type**: number of levels, size ratios, weight usage, line length.
4. **Color**: neutral vs accent ratio, where accent is spent.
5. **Shape and elevation**: radius scale, how depth is expressed.
6. **Density**: items visible in the first viewport.
7. **What to keep / what to reject** for our product and register.

## Motion study from a recording

1. Sample frames locally: `python scripts/reference_capture.py clip.mp4 ./ref-frames --interval 0.5 --max-frames 40`. It does not transcribe audio or interpret motion; you still watch the original for timing.
2. Build the interaction map:

| t | Start state | Gesture | Immediate feedback (<100ms) | Transition | End state | Purpose | Native route | Acceptance |
|---|---|---|---|---|---|---|---|---|
| 00:06 | Summary collapsed | Tap "Details" | Ripple + pressed shape | Expand, no scroll jump | Chart visible | Reveal | `AnimatedVisibility` + `animateContentSize` | Back collapses; TalkBack announces expanded |

3. If the recording has spoken feedback, transcribe only with a real transcription tool or the user's notes. Never invent a transcript from frames.

## Implementation classes

- **A - UI code (default)**: buttons, lists, sheets, page transitions, progress. Compose state + `MotionScheme` springs, `AnimatedContent`, `SharedTransitionLayout`.
- **B - Vector or Canvas driven by state**: progress fills, charts, gauges, simple particles. `Canvas`/`drawBehind`, `AnimatedVectorDrawable`, `graphicsLayer`. Expose a text alternative.
- **C - Authored media**: mascots, character animation, complex illustration. Lottie/vector sequences or short video only with a static fallback, a size budget, and a battery check. Interactive and data UI must never be a video.
- Sensors (tilt, gravity) only when explicitly requested, with an on-screen alternative, pause on lifecycle stop, and reduced-motion off switch.

## Validating against the reference

Record the real app doing the same flow on a device, compare frame by frame against the acceptance column, and fix only failing rows. Report differences you kept on purpose.

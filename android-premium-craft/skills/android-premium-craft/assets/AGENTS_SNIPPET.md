<!-- Paste into the app's AGENTS.md / CLAUDE.md / GEMINI.md. Always-on rules; the android-premium-craft skill has the depth. -->
## Android UI rules (android-premium-craft)

For UI work, load the `android-premium-craft` skill (modes: critique, shape, build, redesign, polish, see, harden, release-review).
- Read `DESIGN.md` first. Use theme roles and tokens only: no hex colors, raw `fontSize` or ad-hoc dp in screens.
- One primary action per screen; the job's key fact visible in the first viewport.
- Touch targets >= 48dp (`minimumInteractiveComponentSize()`); 8dp between targets.
- Every icon-only control has a `contentDescription`; custom controls expose role and state; gestures have visible or `customActions` alternatives.
- Text scales to 200%: `sp` for text, no fixed heights on text containers, wrapping planned.
- Contrast: 4.5:1 text, 3:1 meaningful non-text; color never the only signal.
- Edge-to-edge: `enableEdgeToEdge()`, apply `Scaffold` `innerPadding` once, IME never covers the focused field or primary action.
- Back: no `onBackPressed()` overrides (ignored at targetSdk 36); use navigation library or `OnBackPressedCallback`/`NavigationEvent`.
- Design loading, empty, error, offline and long-content states with the happy path.
- Lazy lists: stable `key`s; `collectAsStateWithLifecycle()`; heavy work out of composition.
- Motion: theme `MotionScheme` springs, interruptible, never blocks input, respects reduced motion.
- Verify by looking: render previews or capture the device before claiming a UI is done.
- Report evidence as observed / verified-in-code / measured / automated-pass / not-run. Never invent FPS or test results.
- Lint before review: `python <skill>/scripts/ui_audit.py lint . --format markdown`.

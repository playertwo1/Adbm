# Evidence ledger (reviewed 2026-10-29)

Treat research as priors, not guarantees. Each entry says what it supports and its limits. Platform rules (normative) are separated from empirical studies and from community anecdotes.

## Contents
- Empirical research
- Normative platform guidance
- Agent and skill effectiveness
- Community signal (qualitative)
- Testable hypotheses for any redesign

## Empirical research

- **Bentley et al., CHI '26 - "Usability Hasn't Peaked: Exploring How Expressive Design Overcomes the Usability Plateau"** (DOI 10.1145/3772318.3790373). 48 participants, 10 apps, M3 Expressive variants vs. earlier Material: on average ~33% faster visual fixation on the target, ~20% faster task completion, higher ratings. *Supports*: using size, color and containment to make the primary target dominant. *Limits*: lab tasks on studied apps; not a promise for any app.
- **Google Design, "Expressive Design: Google's UX Research" (2025)** - synthesis of 46 studies, 18,000+ participants. *Supports*: expressive emphasis aids discoverability and emotional appeal when it matches the product. *Limits*: manufacturer research.
- **Touch target research** underpins the 48dp/~9mm guidance (larger targets reduce errors, especially for motor impairments and on the move). *Limits*: optimal size varies by position and grip; 48dp is a floor, not a target.
- **Readability research** supports 45-75 characters per line and adequate line height for sustained reading. *Limits*: mostly print/desktop; validate on device.

## Normative platform guidance

- Accessibility defaults, 48dp targets, semantics: developer.android.com/develop/ui/compose/accessibility
- Compose accessibility testing (checks since ui-test 1.8): developer.android.com/develop/ui/compose/accessibility/testing
- Edge-to-edge enforcement (SDK 35) and opt-out removal (SDK 36): developer.android.com/about/versions/16/behavior-changes-16
- Predictive back on by default for SDK 36; `onBackPressed` not called: same page
- Large-screen orientation/resizability: ignored at SDK 36 on sw>=600dp, opt-out removed at SDK 37: Android Developers Blog, "Prepare your app for the resizability and orientation changes in Android 17" (Feb 2026)
- Window size classes and adaptive layouts: developer.android.com/develop/ui/compose/build-adaptive-apps
- Haptics principles (clear over buzzy, consistency, frequency): developer.android.com/develop/ui/views/haptics/haptics-principles
- Contrast level API (`UiModeManager.getContrast`, API 34): developer.android.com/reference/android/app/UiModeManager
- Macrobenchmark and frame timing: developer.android.com/topic/performance/benchmarking/macrobenchmark-overview
- WCAG 2.x AA contrast thresholds (4.5:1 / 3:1): w3.org/TR/WCAG22

## Agent and skill effectiveness

- **Agent Skills spec** (agentskills.io): name <= 64 chars, description <= 1024 chars, SKILL.md body < 5k tokens / < 500 lines, references one level deep.
- **Anthropic skill authoring best practices**: concise; third-person descriptions with triggers; progressive disclosure; table of contents in reference files > 100 lines; feedback loops; build at least three evaluations; test on every target model.
- **OpenAI, rethinking skills for newer models**: short trigger-only descriptions; root file as a minimal router; remove rigid itineraries that newer models do better without.
- **Vercel, "AGENTS.md outperforms skills in our agent evals" (Jan 2026)**: a compact always-present docs index reached 100% pass vs. 79% max for skills; skills went uninvoked in 56% of cases without explicit instruction. *Use*: ship an always-on snippet alongside the skill. *Limits*: one framework (Next.js), one eval suite; wording changes swung results.
- **Google android/skills**: official skills target areas where evaluations show LLMs underperform and deliberately skip well-known basics. *Use*: hand off to them; do not duplicate.

## Community signal (qualitative)

- r/ProductManagement "All vibecoded apps look the same" (Jan 2026) and design teardowns: generic outputs come from shared defaults (purple accents, gradients, glass, card grids, Inter). Fix reported by practitioners: explicit design specs/anchors, references, iteration with screenshots.
- r/androiddev threads (2026) on agent mistakes in Compose: `collectAsState` vs lifecycle-aware collection, missing lazy keys, hard-coded strings, `_state.value =` races.
- r/UX_Design: impressive transitions that feel slow; responsiveness beats spectacle.
- Android Authority reader polls on M3 Expressive (2025): majority positive, vocal criticism of reduced personalization. *Use*: expressive is a tool, not a mandate; keep personalization (dynamic color) where users value it.

## Testable hypotheses for any redesign

1. The primary target is identified faster (first-fixation / first-tap test with 5 users).
2. The critical task needs fewer taps and less time.
3. Zero P0/P1 under the `core` device matrix.
4. TalkBack users complete the critical task without sighted help.
5. No regression in frame timing on the main scroll (measured).

Report results as measured or not-run. No invented scores.

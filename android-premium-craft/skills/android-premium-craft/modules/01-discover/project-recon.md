# Project recon

Goal: know what the project can do before proposing anything. Ten minutes here saves a redesign that does not compile.

## Contents
- Run the probe
- Read these files, in this order
- Platform mandates by targetSdk
- Version gates for APIs this skill mentions
- Recon summary format

## Run the probe

```bash
python scripts/project_probe.py <app-root> --format markdown
python scripts/ui_audit.py lint <app-root> --format markdown --max-per-rule 3
python scripts/ui_audit.py palette <app-root>
```

The probe reads Gradle files, version catalogs and manifests with regex. It reports `unknown` instead of guessing. Confirm anything you will rely on in the real files.

## Read these files, in this order

1. `gradle/libs.versions.toml`, root and module `build.gradle(.kts)`: AGP, Kotlin, `compileSdk`, `targetSdk`, `minSdk`, Compose BOM, `material3`, navigation (Nav2 `navigation-compose` vs Nav3 `navigation3`), test and screenshot libraries.
2. `AndroidManifest.xml`: `screenOrientation`, `resizeableActivity`, `windowSoftInputMode`, `enableOnBackInvokedCallback`, themes per activity.
3. Theme code: `Theme.kt`, `Color.kt`, `Type.kt`, `Shape.kt` or `res/values/themes.xml`, `colors.xml`. Note what is a token and what is hard-coded.
4. Shared UI: `designsystem/`, `ui/components/`, `core/ui`. Reuse these before writing new components.
5. The target screen, its ViewModel `UiState`, and its previews/tests. List every state the `UiState` can express.
6. Agent context files: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `DESIGN.md`, `PRODUCT.md`. Follow them; they override this skill's taste defaults.

Toolkit verdict: **Compose**, **Views**, or **hybrid** (`ComposeView`/`AndroidView` bridges). For Views and other toolkits see [toolkits.md](../10-platforms/toolkits.md).

## Platform mandates by targetSdk

| targetSdk | What the platform now does | UI consequence |
|---|---|---|
| 35 (Android 15) | Edge-to-edge enforced on Android 15 devices | Every screen must handle insets; `statusBarColor`/`navigationBarColor` are ignored |
| 36 (Android 16) | Edge-to-edge opt-out (`windowOptOutEdgeToEdgeEnforcement`) disabled; predictive back system animations on by default; `onBackPressed()` not called and `KEYCODE_BACK` not dispatched; on large screens (sw>=600dp) orientation, resizability and aspect-ratio restrictions are ignored unless opted out | Migrate back handling to `OnBackPressedCallback`/`NavigationEvent`; design every screen for landscape and resizable windows on tablets |
| 37 (Android 17) | Developer opt-out for the large-screen orientation/resizability changes removed | Portrait-locked layouts will be stretched or letterboxed into failure; adaptive layout becomes mandatory |

Also check the current Google Play target API requirement in Play Console before planning a release; it moves every year.

## Version gates for APIs this skill mentions

Verify before using. When the project is below the gate, use the fallback and do not upgrade on your own.

| API | Gate (verify in release notes) | Fallback |
|---|---|---|
| `Modifier.minimumInteractiveComponentSize()` | Material 3 1.x | `Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)` |
| Nonlinear font scaling to 200% | Android 14 device | Test at 1.3 on older devices |
| `@PreviewLightDark`, `@PreviewFontScale`, `@PreviewScreenSizes` | compose ui-tooling-preview 1.6+ | Write `@Preview` variants by hand |
| Accessibility checks in Compose tests | compose ui-test 1.8+ | Espresso Accessibility Test Framework, Accessibility Scanner |
| Autofill via `semantics { contentType = ... }` | Compose 1.8+ | Views `autofillHints` interop |
| Expanded `HapticFeedbackType` set | Compose 1.8+ | `View.performHapticFeedback(HapticFeedbackConstants.*)` |
| `MaterialExpressiveTheme`, `MotionScheme`, `MaterialShapes`, `ButtonGroup`, `LoadingIndicator`, `FloatingToolbar` | Material 3 1.4/1.5, most behind `@ExperimentalMaterial3ExpressiveApi` | Standard M3 components + theme springs |
| Compose `Grid`, `FlexBox`, `MediaQuery` | Compose 1.11 era, experimental | `WindowSizeClass` + `Row`/`Column`/`LazyVerticalGrid` |
| Compose Styles API | foundation 1.12 alpha, `compileSdk` 37, experimental opt-in | Theme tokens + modifiers |
| Navigation 3, `NavigationEvent` | SDK 36+ for `NavigationEvent` | Nav2 + `BackHandler`/`PredictiveBackHandler` |
| AGP test-suite screenshot tests | AGP 9.5 alpha, experimental | Roborazzi / Paparazzi / manual capture |

## Recon summary format

```
Toolkit: Compose (100%) | M3 1.4.0 | BOM 2026.09.00 | targetSdk 36 | Nav2
Design system: Theme.kt with 14 roles, Type.kt default, no Shape.kt, 23 hex literals in screens
Mandates: edge-to-edge enforced, predictive back on, large-screen orientation ignored
Tests: unit + 3 Compose UI tests, no screenshot tests, Maestro flows present
Risks: Scaffold padding ignored in 2 screens (lint L001), portrait lock in manifest
Unknowns: real Compose version (BOM alias unresolved) - checked by reading the catalog
```

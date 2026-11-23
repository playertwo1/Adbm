# Toolkits: Views, Flutter, React Native, Compose Multiplatform

The design rules in this skill are toolkit-independent. This table maps the Compose terms used elsewhere to the equivalent in each toolkit. Never migrate toolkits to improve looks unless asked.

## Concept map

| Concept | Compose | XML Views | Flutter | React Native |
|---|---|---|---|---|
| Theme roles | `MaterialTheme.colorScheme` | `?attr/colorPrimary` | `Theme.of(context).colorScheme` (`useMaterial3`) | Theme context / `react-native-paper` MD3 theme |
| Dynamic color | `dynamic*ColorScheme` | `DynamicColors.applyToActivitiesIfAvailable` | `dynamic_color` package | `@pchmn/expo-material3-theme` or native module |
| Type roles | `MaterialTheme.typography` | `?attr/textAppearance*` | `TextTheme` | Paper `MD3Typography` |
| Edge-to-edge | `enableEdgeToEdge()` + insets | `EdgeToEdge.enable` + `setOnApplyWindowInsetsListener` | `SystemChrome.setEnabledSystemUIMode(edgeToEdge)` + `SafeArea`/`MediaQuery.padding` | `react-native-edge-to-edge` + `react-native-safe-area-context` |
| IME | `imePadding()` | `adjustResize` + insets | `MediaQuery.viewInsets` / `resizeToAvoidBottomInset` | `KeyboardAvoidingView` / keyboard-controller |
| 48dp target | `minimumInteractiveComponentSize()` | `minHeight/minWidth 48dp`, `TouchDelegate` | `MaterialTapTargetSize.padded`, `kMinInteractiveDimension` | `hitSlop`, `minHeight: 48` |
| Accessible name | `contentDescription`, `semantics` | `contentDescription`, `labelFor` | `Semantics(label:)`, `tooltip` | `accessibilityLabel`, `accessibilityRole`, `accessibilityState` |
| Heading | `semantics { heading() }` | `accessibilityHeading` | `Semantics(header: true)` | `accessibilityRole="header"` |
| Custom actions | `customActions` | `ViewCompat.addAccessibilityAction` | `Semantics(customSemanticsActions:)` | `accessibilityActions` |
| Predictive back | Nav/`PredictiveBackHandler` | `OnBackPressedCallback` | `PopScope` + `android:enableOnBackInvokedCallback` | `BackHandler`; verify the RN version supports `OnBackInvokedCallback` before enabling the flag |
| Window size | `currentWindowAdaptiveInfo()` | `WindowMetricsCalculator` | `MediaQuery.sizeOf` | `useWindowDimensions` |
| Springs | `MotionScheme`, `spring()` | `SpringAnimation` | `SpringSimulation`, M3 curves | Reanimated `withSpring` |
| Screenshot tests | Roborazzi/Paparazzi/Preview tests | Roborazzi/Paparazzi | golden tests (`matchesGoldenFile`) | Detox/Maestro screenshots |
| Font scale | sp + `@PreviewFontScale` | `sp` | `MediaQuery.textScaler` (do not clamp to 1.0) | `allowFontScaling` (keep true), `maxFontSizeMultiplier` sparingly |

## Toolkit-specific traps

- **Views**: hard-coded `layout_height` on text containers; `textSize` in dp; `TextView` without `ellipsize`/wrapping plan; missing `values-night` resources; `ImageButton` without `contentDescription` (lint X003).
- **Flutter**: clamping `textScaler` to 1.0 to "fix" layouts (fails accessibility); Cupertino widgets on Android; ignoring `SafeArea` with edge-to-edge; `GestureDetector` without `Semantics`.
- **React Native**: `allowFontScaling={false}`; `TouchableOpacity` without `accessibilityRole`; iOS-styled navigation on Android; missing Android ripple (`android_ripple` on `Pressable`).
- **Compose Multiplatform**: Android-specific APIs (insets, haptics, predictive back) behind `expect/actual`; verify Material 3 Expressive availability per target; test on Android, not only desktop previews.

The bundled lint understands Kotlin and XML only; for Flutter/RN, apply the rubric and device matrix (device_matrix.py works for any Android app).

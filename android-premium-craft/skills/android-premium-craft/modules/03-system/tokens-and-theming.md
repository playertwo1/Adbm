# Tokens and theming in code

## Contents
- Token layers
- Compose theme skeleton
- Extended tokens with CompositionLocals
- Material 3 Expressive theme
- Compose Styles API
- Views and hybrid apps
- DESIGN.md as the source of truth

## Token layers

1. **Reference** values: the raw palette, font files, radii (internal to the theme module).
2. **System** tokens: Material roles (`colorScheme`, `typography`, `shapes`, `motionScheme`) plus the app's extended tokens (spacing, semantic colors, elevation steps).
3. **Component** tokens: defaults for the app's own components (`AppButtonDefaults`), built only from system tokens.

Screens consume only layers 2 and 3. Lint rules C001, T003 and D006 flag leaks.

## Compose theme skeleton

A ready template lives in [CraftTheme.kt](../../assets/compose/CraftTheme.kt). The essentials:

```kotlin
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val colors = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        darkTheme -> AppDarkColors
        else -> AppLightColors
    }
    val extended = if (darkTheme) DarkExtendedColors else LightExtendedColors
    CompositionLocalProvider(
        LocalExtendedColors provides extended,
        LocalSpacing provides Spacing(),
    ) {
        MaterialTheme(colorScheme = colors, typography = AppTypography, shapes = AppShapes, content = content)
    }
}
```

## Extended tokens with CompositionLocals

```kotlin
@Immutable
data class Spacing(val xs: Dp = 4.dp, val s: Dp = 8.dp, val m: Dp = 12.dp, val l: Dp = 16.dp, val xl: Dp = 24.dp, val xxl: Dp = 32.dp)
val LocalSpacing = staticCompositionLocalOf { Spacing() }

object AppTheme {
    val spacing: Spacing @Composable @ReadOnlyComposable get() = LocalSpacing.current
    val extendedColors: ExtendedColors @Composable @ReadOnlyComposable get() = LocalExtendedColors.current
}
```

- `staticCompositionLocalOf` for values that rarely change (tokens); `compositionLocalOf` only for values that change at runtime and are read in few places.
- Keep tokens `@Immutable` data classes so Compose can skip.

## Material 3 Expressive theme

- `MaterialExpressiveTheme(colorScheme, motionScheme, shapes, typography)` and `MotionScheme.expressive()` / `MotionScheme.standard()` are the entry points. Most are annotated `@ExperimentalMaterial3ExpressiveApi`: confirm the Material 3 version and get the user's OK to opt in.
- Use expressive motion for prominent, hero interactions and standard motion for utility flows; mixing per screen is fine.
- Read springs from the theme instead of hand-made `tween`s: `MaterialTheme.motionScheme.defaultSpatialSpec<Float>()`, `fastEffectsSpec()`, etc.

## Compose Styles API

A newer, experimental way to define styleable custom components (`Style`, `Modifier.styleable`, state-based styles). Requirements are strict (alpha foundation, `compileSdk` 37, opt-in). Use it only when the user wants it; follow the official `styles` skill. For Material components keep using the component `colors`/`shapes` parameters.

## Views and hybrid apps

- Theme: `Theme.Material3.DayNight.NoActionBar` (or DynamicColors variant) in `themes.xml` and `values-night`; component styles via `materialButtonStyle`, `textAppearance*`, `shapeAppearance*` overlays.
- Read attributes (`?attr/colorSurfaceContainer`), never hard-code.
- Hybrid: wrap every `ComposeView` in the same Compose theme and derive both themes from one token source (for example, generate `colors.xml` and `Color.kt` from the same Theme Builder export). Do not let Compose and Views drift.

## DESIGN.md as the source of truth

Write tokens, anchor, component rules and exceptions in `DESIGN.md` at the repo root ([DESIGN_TEMPLATE.md](../../assets/DESIGN_TEMPLATE.md)). Agents read it before UI work; humans review it like code. Update it in the same change that changes the theme.

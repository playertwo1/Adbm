// Template from android-premium-craft. Copy into your design-system module and rename the package.
// The sample palette is a teal seed (#006A6A) for illustration only: replace it with a full
// Material Theme Builder export of YOUR brand. Roles you omit fall back to the baseline scheme.
package com.example.designsystem.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

private val LightColors = lightColorScheme(
    primary = Color(0xFF006A6A), onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFF9CF1F0), onPrimaryContainer = Color(0xFF002020),
    secondary = Color(0xFF4A6363), onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFCCE8E7), onSecondaryContainer = Color(0xFF051F1F),
    tertiary = Color(0xFF4B607C), onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFD3E4FF), onTertiaryContainer = Color(0xFF041C35),
    error = Color(0xFFBA1A1A), onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFFDAD6), onErrorContainer = Color(0xFF410002),
    background = Color(0xFFFAFDFC), onBackground = Color(0xFF191C1C),
    surface = Color(0xFFFAFDFC), onSurface = Color(0xFF191C1C),
    surfaceVariant = Color(0xFFDAE5E4), onSurfaceVariant = Color(0xFF3F4948),
    surfaceContainerLowest = Color(0xFFFFFFFF), surfaceContainerLow = Color(0xFFEFF5F4),
    surfaceContainer = Color(0xFFE9EFEE), surfaceContainerHigh = Color(0xFFE3E9E9),
    surfaceContainerHighest = Color(0xFFDDE4E3),
    outline = Color(0xFF6F7979), outlineVariant = Color(0xFFBEC9C8),
    inverseSurface = Color(0xFF2D3131), inverseOnSurface = Color(0xFFEFF1F0),
    inversePrimary = Color(0xFF80D5D4),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF80D5D4), onPrimary = Color(0xFF003737),
    primaryContainer = Color(0xFF004F4F), onPrimaryContainer = Color(0xFF9CF1F0),
    secondary = Color(0xFFB0CCCB), onSecondary = Color(0xFF1B3534),
    secondaryContainer = Color(0xFF324B4B), onSecondaryContainer = Color(0xFFCCE8E7),
    tertiary = Color(0xFFB3C8E8), onTertiary = Color(0xFF1C314B),
    tertiaryContainer = Color(0xFF334863), onTertiaryContainer = Color(0xFFD3E4FF),
    error = Color(0xFFFFB4AB), onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A), onErrorContainer = Color(0xFFFFDAD6),
    background = Color(0xFF0E1514), onBackground = Color(0xFFE0E3E2),
    surface = Color(0xFF0E1514), onSurface = Color(0xFFE0E3E2),
    surfaceVariant = Color(0xFF3F4948), onSurfaceVariant = Color(0xFFBEC9C8),
    surfaceContainerLowest = Color(0xFF090F0F), surfaceContainerLow = Color(0xFF161D1D),
    surfaceContainer = Color(0xFF1A2121), surfaceContainerHigh = Color(0xFF252B2B),
    surfaceContainerHighest = Color(0xFF2F3636),
    outline = Color(0xFF889392), outlineVariant = Color(0xFF3F4948),
    inverseSurface = Color(0xFFE0E3E2), inverseOnSurface = Color(0xFF2D3131),
    inversePrimary = Color(0xFF006A6A),
)

/** Semantic roles Material 3 does not provide. Same four-part structure as M3 roles. */
@Immutable
data class ExtendedColors(
    val success: Color, val onSuccess: Color, val successContainer: Color, val onSuccessContainer: Color,
    val warning: Color, val onWarning: Color, val warningContainer: Color, val onWarningContainer: Color,
)

private val LightExtended = ExtendedColors(
    success = Color(0xFF2E6B30), onSuccess = Color(0xFFFFFFFF),
    successContainer = Color(0xFFB0F2AA), onSuccessContainer = Color(0xFF002203),
    warning = Color(0xFF7A5900), onWarning = Color(0xFFFFFFFF),
    warningContainer = Color(0xFFFFDEA6), onWarningContainer = Color(0xFF261900),
)

private val DarkExtended = ExtendedColors(
    success = Color(0xFF95D590), onSuccess = Color(0xFF003908),
    successContainer = Color(0xFF13521A), onSuccessContainer = Color(0xFFB0F2AA),
    warning = Color(0xFFF5BE48), onWarning = Color(0xFF402D00),
    warningContainer = Color(0xFF5C4200), onWarningContainer = Color(0xFFFFDEA6),
)

/** 4dp-grid spacing scale. Screens use these names, never raw dp. */
@Immutable
data class Spacing(
    val xxs: Dp = 2.dp, val xs: Dp = 4.dp, val s: Dp = 8.dp, val m: Dp = 12.dp,
    val l: Dp = 16.dp, val xl: Dp = 24.dp, val xxl: Dp = 32.dp, val xxxl: Dp = 48.dp,
)

private val LocalExtendedColors = staticCompositionLocalOf { LightExtended }
private val LocalSpacing = staticCompositionLocalOf { Spacing() }

// Replace FontFamily.Default per role to apply the anchor's typefaces.
private val AppTypography = Typography()

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

/** Tabular figures for numbers that update or align in columns. */
val TextStyle.tabular: TextStyle get() = copy(fontFeatureSettings = "tnum")

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // true for apps without a strong brand
    content: @Composable () -> Unit,
) {
    val colors = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColors
        else -> LightColors
    }
    CompositionLocalProvider(
        LocalExtendedColors provides if (darkTheme) DarkExtended else LightExtended,
        LocalSpacing provides Spacing(),
    ) {
        MaterialTheme(colorScheme = colors, typography = AppTypography, shapes = AppShapes, content = content)
    }
}

/** Access point for app tokens: AppTokens.spacing.l, AppTokens.colors.success. */
object AppTokens {
    val spacing: Spacing
        @Composable @ReadOnlyComposable get() = LocalSpacing.current
    val colors: ExtendedColors
        @Composable @ReadOnlyComposable get() = LocalExtendedColors.current
}

package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme =
  darkColorScheme(
    primary = CoreFlowPrimary,
    onPrimary = CoreFlowCanvas,
    secondary = CoreFlowSecondary,
    onSecondary = CoreFlowCanvas,
    tertiary = CoreFlowAlert,
    onTertiary = CoreFlowCanvas,
    background = CoreFlowCanvas,
    onBackground = CoreFlowOnSurface,
    surface = CoreFlowSurface,
    onSurface = CoreFlowOnSurface,
    surfaceVariant = CoreFlowSurfaceRaised,
    onSurfaceVariant = CoreFlowOnSurfaceVariant,
    error = CoreFlowDanger,
    onError = CoreFlowCanvas,
  )

@Composable
fun MyApplicationTheme(content: @Composable () -> Unit) {
  MaterialTheme(colorScheme = DarkColorScheme, typography = Typography, content = content)
}

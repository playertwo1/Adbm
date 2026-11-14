package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme =
  lightColorScheme(
    primary = CoreFlowPrimary,
    onPrimary = CoreFlowSurface,
    secondary = CoreFlowSecondary,
    onSecondary = CoreFlowSurface,
    tertiary = CoreFlowAlert,
    onTertiary = CoreFlowSurface,
    background = CoreFlowCanvas,
    onBackground = CoreFlowOnSurface,
    surface = CoreFlowSurface,
    onSurface = CoreFlowOnSurface,
    surfaceVariant = CoreFlowSurfaceRaised,
    onSurfaceVariant = CoreFlowOnSurfaceVariant,
    error = CoreFlowDanger,
    onError = CoreFlowSurface,
  )

private val AmoledColorScheme =
  darkColorScheme(
    primary = CoreFlowAmoledPrimary,
    onPrimary = CoreFlowAmoledCanvas,
    secondary = CoreFlowAmoledSecondary,
    onSecondary = CoreFlowAmoledCanvas,
    tertiary = CoreFlowAmoledAlert,
    onTertiary = CoreFlowAmoledCanvas,
    background = CoreFlowAmoledCanvas,
    onBackground = CoreFlowAmoledOnSurface,
    surface = CoreFlowAmoledSurface,
    onSurface = CoreFlowAmoledOnSurface,
    surfaceVariant = CoreFlowAmoledSurfaceRaised,
    onSurfaceVariant = CoreFlowAmoledOnSurfaceVariant,
    error = CoreFlowAmoledDanger,
    onError = CoreFlowAmoledCanvas,
  )

@Composable
fun MyApplicationTheme(amoled: Boolean = true, content: @Composable () -> Unit) {
  MaterialTheme(colorScheme = if (amoled) AmoledColorScheme else LightColorScheme, typography = Typography, content = content)
}

// Template from android-premium-craft. Requires androidx.compose.ui:ui-tooling-preview 1.6+.
// Put one @CraftStressPreviews preview per UI state so the agent (and reviewers) can see every state.
package com.example.designsystem.preview

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewFontScale
import androidx.compose.ui.tooling.preview.PreviewLightDark
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.compose.ui.tooling.preview.PreviewScreenSizes

/** Light/dark, 200% text, RTL and landscape phone: the configurations that break layouts. */
@PreviewLightDark
@Preview(name = "Font 200%", fontScale = 2f, showBackground = true)
@Preview(name = "RTL", locale = "ar", showBackground = true)
@Preview(
    name = "Landscape phone",
    device = "spec:width=411dp,height=891dp,dpi=420,orientation=landscape",
    showBackground = true,
)
annotation class CraftStressPreviews

/** Phone, foldable, tablet and desktop widths for adaptive layouts. */
@PreviewScreenSizes
annotation class CraftFormFactorPreviews

/** Every built-in font scale step (0.85 to 2.0). */
@PreviewFontScale
annotation class CraftFontScalePreviews

// --- Example: one preview per UiState. Replace with your screen's real state type. ---

sealed interface InvoicesUiState {
    data object Loading : InvoicesUiState
    data object Empty : InvoicesUiState
    data class Error(val message: String) : InvoicesUiState
    data class Content(val items: List<String>) : InvoicesUiState
}

class InvoicesStateProvider : PreviewParameterProvider<InvoicesUiState> {
    override val values = sequenceOf(
        InvoicesUiState.Loading,
        InvoicesUiState.Empty,
        InvoicesUiState.Error("Couldn't load invoices. Check your connection and try again."),
        // Worst-case content: long names and large amounts catch clipping early.
        InvoicesUiState.Content(
            listOf(
                "Invoice 34 - Comercial Distribuidora de Alimentos Nordeste Ltda.",
                "Invoice 35 - R$ 1.234.567,89",
                "Invoice 36",
            ),
        ),
    )
}

@CraftStressPreviews
@Composable
private fun InvoicesScreenPreview(@PreviewParameter(InvoicesStateProvider::class) state: InvoicesUiState) {
    // AppTheme { InvoicesScreen(state = state, onPay = {}) }
}

// Template from android-premium-craft. Instrumented Compose test (androidTest).
// Needs androidx.compose.ui:ui-test-junit4 and, for the automated checks,
// androidx.compose.ui:ui-test-junit4-accessibility (Compose 1.8+). Verify imports against
// https://developer.android.com/develop/ui/compose/accessibility/testing for your version.
package com.example.feature.invoices

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.DeviceConfigurationOverride
import androidx.compose.ui.test.FontScale
import androidx.compose.ui.test.LayoutDirection
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.accessibility.enableAccessibilityChecks
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.then
import androidx.compose.ui.test.tryPerformAccessibilityChecks
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class InvoicesAccessibilityTest {

    @get:Rule
    val rule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun automatedAccessibilityChecks_pass() {
        rule.enableAccessibilityChecks()
        rule.setContent { /* AppTheme { InvoicesScreen(state = sampleContent, onPay = {}) } */ }
        rule.onRoot().tryPerformAccessibilityChecks()
    }

    @Test
    fun primaryAction_hasNameAndTouchTarget() {
        rule.setContent { /* AppTheme { InvoicesScreen(state = sampleContent, onPay = {}) } */ }
        val pay = rule.onNodeWithText("Pay invoice").assertHasClickAction()
        val bounds = pay.fetchSemanticsNode().touchBoundsInRoot
        with(rule.density) {
            assertTrue("Touch target under 48dp", bounds.height.toDp() >= 48.dp && bounds.width.toDp() >= 48.dp)
        }
        rule.onNodeWithContentDescription("Search").assertHasClickAction()
    }

    @Test
    fun survives200PercentTextInRtl() {
        rule.setContent {
            DeviceConfigurationOverride(
                DeviceConfigurationOverride.FontScale(2f) then
                    DeviceConfigurationOverride.LayoutDirection(androidx.compose.ui.unit.LayoutDirection.Rtl),
            ) {
                /* AppTheme { InvoicesScreen(state = sampleContent, onPay = {}) } */
            }
        }
        rule.onNodeWithText("Pay invoice").assertIsDisplayed()
    }
}

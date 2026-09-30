package com.example

import android.content.Context
import android.graphics.Color
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class WorkoutOverlayTest {

  @Test
  fun `overlay preferences defaults are safe and disabled initially`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val prefs = WorkoutOverlayController.loadPreferences(context)

    assertFalse("Overlay deve vir desativado por padrão", prefs.enabled)
    assertEquals("Tamanho padrão inicial deve ser compact", WorkoutOverlayController.SIZE_COMPACT, prefs.defaultSize)
    assertTrue("Recolhimento automático deve vir ativo por padrão", prefs.autoCollapse)
    assertTrue("Mostrar próximo passo deve vir ativo por padrão", prefs.showNextStep)
  }

  @Test
  fun `overlay preferences persist and parse JSON correctly`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val json = """
      {
        "enabled": true,
        "defaultSize": "expanded",
        "autoCollapse": false,
        "showNextStep": false
      }
    """.trimIndent()

    WorkoutOverlayController.savePreferences(context, json)
    val prefs = WorkoutOverlayController.loadPreferences(context)

    assertTrue("Overlay deve estar ativado após salvar", prefs.enabled)
    assertEquals("Tamanho deve ser expanded", WorkoutOverlayController.SIZE_EXPANDED, prefs.defaultSize)
    assertFalse("Recolhimento deve estar desativado", prefs.autoCollapse)
    assertFalse("Mostrar próximo passo deve estar desativado", prefs.showNextStep)
  }

  @Test
  fun `overlay preferences fallback gracefully on malformed JSON`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    WorkoutOverlayController.savePreferences(context, "invalid-json")
    val prefs = WorkoutOverlayController.loadPreferences(context)

    assertNotNull("Preferências nunca devem ser nulas", prefs)
  }

  @Test
  fun `time formatting produces clean MM SS string`() {
    val formattedZero = WorkoutOverlayController.formatTime(0)
    assertEquals("00:00", formattedZero)

    val formattedMinute = WorkoutOverlayController.formatTime(65)
    assertEquals("01:05", formattedMinute)

    val formattedTenMinutes = WorkoutOverlayController.formatTime(600)
    assertEquals("10:00", formattedTenMinutes)
  }

  @Test
  fun `program theme color resolves accurately per exercise type`() {
    // Vacuo em fase de apneia (esmeralda)
    val colorVacuo = WorkoutOverlayController.resolveThemeColor("Vácuo Abdominal", "vacuo", false)
    assertEquals(Color.parseColor("#10B981"), colorVacuo)

    // Descanso / recuperação (sky / azul)
    val colorDescanso = WorkoutOverlayController.resolveThemeColor("Vácuo Abdominal", "descanso", true)
    assertEquals(Color.parseColor("#0EA5E9"), colorDescanso)

    // Kegel (roxo)
    val colorKegel = WorkoutOverlayController.resolveThemeColor("Kegel: Assoalho Pélvico", "contracao", false)
    assertEquals(Color.parseColor("#A855F7"), colorKegel)

    // Bracing (âmbar)
    val colorBracing = WorkoutOverlayController.resolveThemeColor("Bracing Avançado", "isometria", false)
    assertEquals(Color.parseColor("#F59E0B"), colorBracing)
  }

  @Test
  fun `hideOverlay is idempotent and does not throw if view not attached`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    WorkoutOverlayController.hideOverlay(context)
    WorkoutOverlayController.hideOverlay(context)
    assertFalse(WorkoutOverlayController.isOverlayVisible())
  }
}

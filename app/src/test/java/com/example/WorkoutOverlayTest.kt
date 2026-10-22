package com.example

import android.app.Application
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.os.Looper
import android.animation.ValueAnimator
import android.provider.Settings
import java.io.ByteArrayInputStream
import java.io.InputStream
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.test.core.app.ApplicationProvider
import androidx.core.graphics.ColorUtils
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.TimeUnit
import org.robolectric.Shadows
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowBitmapFactory

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class WorkoutOverlayTest {

  private fun overlayViews(root: View): List<View> = buildList {
    add(root)
    if (root is ViewGroup) {
      for (index in 0 until root.childCount) addAll(overlayViews(root.getChildAt(index)))
    }
  }

  private fun createExpandedOverlay(context: Context): FrameLayout {
    val root = FrameLayout(context)
    val method = WorkoutOverlayController::class.java.getDeclaredMethod(
      "buildExpandedView",
      Context::class.java,
      FrameLayout::class.java
    ).apply { isAccessible = true }
    method.invoke(WorkoutOverlayController, context, root)
    return root
  }

  private fun bindOverlayState(context: Context, state: JSONObject) {
    val method = WorkoutOverlayController::class.java.getDeclaredMethod(
      "bindStateToViews",
      Context::class.java,
      JSONObject::class.java,
      WorkoutOverlayController.OverlayPreferences::class.java
    ).apply { isAccessible = true }
    method.invoke(
      WorkoutOverlayController,
      context,
      state,
      WorkoutOverlayController.OverlayPreferences(enabled = true, autoCollapse = false)
    )
  }

  private fun buildOverlayPart(context: Context, methodName: String): FrameLayout {
    val root = FrameLayout(context)
    WorkoutOverlayController::class.java.getDeclaredMethod(
      methodName,
      Context::class.java,
      FrameLayout::class.java
    ).apply {
      isAccessible = true
      invoke(WorkoutOverlayController, context, root)
    }
    return root
  }

  private fun setLastOverlayState(state: JSONObject) {
    WorkoutOverlayController::class.java.getDeclaredField("lastRawState").apply {
      isAccessible = true
      set(WorkoutOverlayController, state)
    }
  }

  private fun stretchGuideCue(cardId: Int, duration: Int, timeLeft: Int): Pair<Int, String> {
    val cue = WorkoutOverlayController::class.java.getDeclaredMethod(
      "resolveStretchGuideCue",
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType
    ).apply { isAccessible = true }.invoke(WorkoutOverlayController, cardId, duration, timeLeft)
      ?: error("Pista corporal ausente")
    val cueType = cue.javaClass
    val frame = cueType.getDeclaredField("frame").apply { isAccessible = true }.getInt(cue)
    val side = cueType.getDeclaredField("sideLabel").apply { isAccessible = true }.get(cue) as String
    return frame to side
  }

  private fun takeStartedServiceAction(context: Context): String? =
    Shadows.shadowOf(context.applicationContext as Application).nextStartedService?.action

  private fun stateWithImage(
    image: String?,
    type: String = "stretch",
    cardId: Int = 2,
    duration: Int = 60,
    timeLeft: Int = duration,
    status: String = "running"
  ): JSONObject {
    val step = JSONObject().put("title", "Torção sentada").put("duration", duration).put("phase", "stretch")
    if (image != null) step.put("image", image)
    return JSONObject()
      .put("status", status)
      .put("currentStepIndex", 0)
      .put("stepTimeLeft", timeLeft)
      .put("steps", JSONArray().put(step))
      .put("session", JSONObject()
        .put("type", type)
        .put("programTitle", if (type == "breath") "Respiração" else "Pausa: Alongamento")
        .put("programId", "pausa_stretch_$cardId")
        .put("cardId", cardId))
  }

  @Test
  fun `initial overlay state honors expanded preference`() {
    val method = WorkoutOverlayController::class.java.declaredMethods.firstOrNull {
      it.name == "initialVisualState"
    }
    assertNotNull("Mapeamento de defaultSize para VisualState deve existir", method)
    method!!.isAccessible = true
    val expanded = WorkoutOverlayController.OverlayPreferences(defaultSize = WorkoutOverlayController.SIZE_EXPANDED)
    val mini = WorkoutOverlayController.OverlayPreferences(defaultSize = WorkoutOverlayController.SIZE_MINI)
    val compact = WorkoutOverlayController.OverlayPreferences(defaultSize = WorkoutOverlayController.SIZE_COMPACT)
    assertEquals(WorkoutOverlayController.VisualState.EXPANDED, method.invoke(WorkoutOverlayController, expanded))
    assertEquals(WorkoutOverlayController.VisualState.MINI, method.invoke(WorkoutOverlayController, mini))
    assertEquals(WorkoutOverlayController.VisualState.COMPACT, method.invoke(WorkoutOverlayController, compact))
  }

  @Test
  fun `expanded overlay exposes textual cancel separately from collapse`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val views = overlayViews(createExpandedOverlay(context))
    val textViews = views.filterIsInstance<TextView>()

    assertTrue("Overlay expandido deve oferecer Cancelar textual", textViews.any {
      it.text.toString().equals("Cancelar", ignoreCase = true) && it.contentDescription == "Cancelar treino"
    })
    assertTrue("Recolher continua separado do cancelamento", textViews.any {
      it.contentDescription == "Recolher modo expandido"
    })
  }

  @Test
  fun `compact overlay exposes textual pause resume and cancel controls`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val views = overlayViews(buildOverlayPart(context, "buildCompactView"))
    val labels = views.filterIsInstance<TextView>().map { it.text.toString() }

    assertTrue("Compacto em andamento deve mostrar Pausar", labels.contains("⏸ Pausar"))
    assertTrue("Compacto deve oferecer Cancelar textual", labels.contains("Cancelar"))
  }

  @Test
  fun `compact pause control reflects paused state`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val root = buildOverlayPart(context, "buildCompactView")
    bindOverlayState(context, stateWithImage(null).put("status", "paused"))
    val pause = overlayViews(root).filterIsInstance<TextView>().firstOrNull {
      it.contentDescription == "Continuar treino"
    }

    assertNotNull("Compacto pausado deve oferecer Continuar", pause)
    assertEquals("▶ Continuar", pause!!.text.toString())
  }

  @Test
  fun `mini overlay exposes open affordance without pause or cancel`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val labels = overlayViews(buildOverlayPart(context, "buildMiniView"))
      .filterIsInstance<TextView>()
      .map { it.text.toString() }

    assertTrue("Mini deve indicar como abrir os controles", labels.contains("Abrir"))
    assertFalse("Mini deve abrir os controles antes de cancelar", labels.contains("Cancelar"))
  }

  @Test
  fun `cancel confirmation pauses running session and confirm uses stop action`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val state = stateWithImage(null).put("status", "running")
    setLastOverlayState(state)
    val root = createExpandedOverlay(context)
    val views = overlayViews(root)
    val cancel = views.filterIsInstance<TextView>().firstOrNull { it.contentDescription == "Cancelar treino" }
    assertNotNull("Expandido deve permitir iniciar a confirmação de cancelamento", cancel)

    cancel!!.performClick()
    assertEquals(WorkoutForegroundService.ACTION_PAUSE, takeStartedServiceAction(context))
    val confirm = overlayViews(root).filterIsInstance<TextView>().firstOrNull {
      it.text.toString() == "Cancelar sessão" && it.visibility == View.VISIBLE
    }
    assertNotNull("Confirmação deve pedir confirmação textual", confirm)
    confirm!!.performClick()
    assertEquals("Confirmar cancelamento deve usar ACTION_STOP", WorkoutForegroundService.ACTION_STOP, takeStartedServiceAction(context))
  }

  @Test
  fun `cancel confirmation sends stop only once`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    setLastOverlayState(stateWithImage(null).put("status", "paused"))
    val root = createExpandedOverlay(context)
    val views = overlayViews(root).filterIsInstance<TextView>()
    views.first { it.contentDescription == "Cancelar treino" }.performClick()
    val confirm = overlayViews(root).filterIsInstance<TextView>().first { it.text.toString() == "Cancelar sessão" }

    confirm.performClick()
    assertEquals(WorkoutForegroundService.ACTION_STOP, takeStartedServiceAction(context))
    confirm.performClick()
    assertEquals("Confirmação repetida não deve enviar outra parada", null, takeStartedServiceAction(context))
  }

  @Test
  fun `dismissing cancel confirmation resumes only a session that was running`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val state = stateWithImage(null).put("status", "running")
    setLastOverlayState(state)
    val root = createExpandedOverlay(context)
    val cancel = overlayViews(root).filterIsInstance<TextView>().firstOrNull { it.contentDescription == "Cancelar treino" }
    assertNotNull(cancel)
    cancel!!.performClick()
    assertEquals(WorkoutForegroundService.ACTION_PAUSE, takeStartedServiceAction(context))
    val keep = overlayViews(root).filterIsInstance<TextView>().firstOrNull {
      it.text.toString() == "Continuar treino" && it.visibility == View.VISIBLE
    }
    assertNotNull("A desistência deve permitir continuar a sessão", keep)
    keep!!.performClick()
    assertEquals(WorkoutForegroundService.ACTION_RESUME, takeStartedServiceAction(context))

    val pausedState = stateWithImage(null).put("status", "paused")
    setLastOverlayState(pausedState)
    val pausedRoot = createExpandedOverlay(context)
    val pausedCancel = overlayViews(pausedRoot).filterIsInstance<TextView>().firstOrNull {
      it.contentDescription == "Cancelar treino"
    }
    assertNotNull(pausedCancel)
    pausedCancel!!.performClick()
    assertEquals("Sessão já pausada não deve receber nova pausa", null, takeStartedServiceAction(context))
    val keepPaused = overlayViews(pausedRoot).filterIsInstance<TextView>().firstOrNull {
      it.text.toString() == "Manter treino pausado" && it.visibility == View.VISIBLE
    }
    assertNotNull(keepPaused)
    keepPaused!!.performClick()
    assertEquals("Desistir não pode retomar sessão que já estava pausada", null, takeStartedServiceAction(context))
  }

  @Test
  fun `cancel confirmation during paused vacuum keeps safe exit action separate`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val state = stateWithImage(null).put("status", "paused")
    state.getJSONArray("steps").getJSONObject(0).put("phase", "vacuo")
    setLastOverlayState(state)
    val root = createExpandedOverlay(context)
    bindOverlayState(context, state)
    val views = overlayViews(root).filterIsInstance<TextView>()
    val safeExit = views.firstOrNull { it.text.toString() == "Encerrar Retenção com Segurança" }
    assertNotNull("Vácuo deve manter a saída segura textual", safeExit)
    safeExit!!.performClick()
    assertEquals(
      "Saída segura da retenção preserva sua ação dedicada",
      WorkoutForegroundService.ACTION_SAFE_EXIT_RETENTION,
      takeStartedServiceAction(context)
    )

    val cancel = views.firstOrNull { it.contentDescription == "Cancelar treino" }
    assertNotNull(cancel)
    cancel!!.performClick()
    assertEquals("Abrir confirmação de sessão pausada não retoma nem envia parada", null, takeStartedServiceAction(context))
    val keep = overlayViews(root).filterIsInstance<TextView>().firstOrNull { it.text.toString() == "Manter treino pausado" }
    assertNotNull(keep)
    keep!!.performClick()
    assertEquals("Desistir durante retenção pausada não retoma a sessão", null, takeStartedServiceAction(context))

    cancel.performClick()
    val confirm = overlayViews(root).filterIsInstance<TextView>().firstOrNull { it.text.toString() == "Cancelar sessão" }
    assertNotNull(confirm)
    confirm!!.performClick()
    assertEquals("Confirmar cancelamento segue separado da saída segura", WorkoutForegroundService.ACTION_STOP, takeStartedServiceAction(context))
  }

  @Test
  fun `missing or invalid exercise image shows fallback and clears stale image`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val views = overlayViews(createExpandedOverlay(context))
    val image = views.filterIsInstance<ImageView>().single()
    val fallback = views.filterIsInstance<TextView>().firstOrNull {
      it.text.toString().contains("Orientação visual indisponível", ignoreCase = true)
    }
    assertNotNull("Imagem ausente deve ter fallback textual", fallback)

    bindOverlayState(context, stateWithImage("img/pausas/stretch-sequence-2.png"))
    assertEquals(View.VISIBLE, image.visibility)
    assertEquals("imagem válida não deve deixar fallback visível", View.GONE, fallback!!.visibility)

    for (path in listOf("img/pausas/nao-existe.webp", "index.html", "")) {
      bindOverlayState(context, stateWithImage(path))
      assertEquals("Imagem inválida não pode continuar mostrando a postura anterior ($path)", View.GONE, image.visibility)
      assertEquals("Falha de imagem deve limpar a imagem anterior ($path)", null, image.drawable)
      assertEquals("Falha de imagem deve mostrar orientação textual ($path)", View.VISIBLE, fallback.visibility)
    }

    bindOverlayState(context, stateWithImage("img/pausas/nao-existe.webp", type = "breath"))
    assertEquals("Transição para respiração não deve deixar fallback corporal visível", View.GONE, fallback.visibility)
  }

  @Test
  fun `corrupt bytes with a supported image extension decode to fallback`() {
    val decode = WorkoutOverlayController::class.java.getDeclaredMethod(
      "decodeExerciseGuideBitmap",
      InputStream::class.java,
      Int::class.javaObjectType
    ).apply { isAccessible = true }

    ShadowBitmapFactory.setAllowInvalidImageData(false)
    try {
      val result = decode.invoke(WorkoutOverlayController, ByteArrayInputStream("not a png image".toByteArray()), 0)
      assertEquals("bytes corrompidos não podem produzir um atlas exibível", null, result)
    } finally {
      ShadowBitmapFactory.reset()
    }
  }

  @Test
  fun `all four local stretch atlases decode into visible native guides`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val root = createExpandedOverlay(context)
    val image = overlayViews(root).filterIsInstance<ImageView>().single()

    for (cardId in 1..4) {
      val path = "img/pausas/stretch-sequence-$cardId.png"
      bindOverlayState(context, stateWithImage(path, cardId = cardId, timeLeft = 60))

      assertEquals("Cada exercício precisa exibir seu atlas local ($cardId)", View.VISIBLE, image.visibility)
      assertNotNull("O atlas precisa ser decodificado ($cardId)", image.drawable)
      assertTrue("O recorte precisa ter dimensões válidas ($cardId)", image.drawable.intrinsicWidth > 0 && image.drawable.intrinsicHeight > 0)
    }
  }

  @Test
  fun `native breath motion interpolates one engine tick and freezes while paused`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val view = BreathVisualView(context)
    val update = BreathVisualView::class.java.getDeclaredMethod(
      "updateState",
      Boolean::class.javaPrimitiveType,
      String::class.java,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      String::class.java,
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val progressField = BreathVisualView::class.java.getDeclaredField("motionProgress")
      .apply { isAccessible = true }
    val animatorField = BreathVisualView::class.java.getDeclaredField("motionAnimator")
      .apply { isAccessible = true }

    fun update(isRunning: Boolean) {
      update.invoke(view, false, "INSPIRAR", 4, 4, Color.CYAN, 0, "inspire", isRunning)
    }
    fun progress(): Float = progressField.getFloat(view)

    update(true)
    val start = progress()
    val animator = animatorField.get(view) as ValueAnimator
    assertEquals("a interpolação visual não pode criar um segundo temporizador de fase", 1000L, animator.duration)
    animator.currentPlayTime = 500L
    val halfway = progress()
    assertTrue("a respiração deve interpolar entre dois ticks nativos (início=$start, meio=$halfway)", halfway > start && halfway < 0.25f)

    update(false)
    val frozen = progress()
    assertTrue("pausar deve pausar o interpolador visual", animator.isPaused)
    Shadows.shadowOf(Looper.getMainLooper()).idleFor(1000, TimeUnit.MILLISECONDS)
    assertEquals("a animação deve ficar congelada enquanto o motor está pausado", frozen, progress(), 0.001f)

    update(true)
    assertFalse("retomar deve continuar o interpolador pausado", animator.isPaused)
  }

  @Test
  fun `native zero duration breath phase remains static without dividing by zero`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val view = BreathVisualView(context)
    val update = BreathVisualView::class.java.getDeclaredMethod(
      "updateState",
      Boolean::class.javaPrimitiveType,
      String::class.java,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      String::class.java,
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val progress = BreathVisualView::class.java.getDeclaredField("motionProgress").apply { isAccessible = true }
    val animator = BreathVisualView::class.java.getDeclaredField("motionAnimator").apply { isAccessible = true }

    update.invoke(view, false, "VAZIO", 0, 0, Color.CYAN, 3, "hold2", true)
    assertEquals("fase de duração zero não agenda movimento", null, animator.get(view))
    assertEquals("a fase zero termina estática em um quadro válido", 1f, progress.getFloat(view), 0.001f)
  }

  @Test
  fun `native zero duration breath phase keeps its final frame with app reduced motion`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val view = BreathVisualView(context)
    val setReducedMotion = BreathVisualView::class.java.getDeclaredMethod(
      "setAppReducedMotion",
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val update = BreathVisualView::class.java.getDeclaredMethod(
      "updateState",
      Boolean::class.javaPrimitiveType,
      String::class.java,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      String::class.java,
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val progress = BreathVisualView::class.java.getDeclaredField("motionProgress").apply { isAccessible = true }
    val animator = BreathVisualView::class.java.getDeclaredField("motionAnimator").apply { isAccessible = true }

    setReducedMotion.invoke(view, true)
    update.invoke(view, false, "VAZIO", 0, 0, Color.CYAN, 3, "hold2", true)

    assertEquals("duração zero não agenda interpolador", null, animator.get(view))
    assertEquals("duração zero mantém o quadro final mesmo com movimento reduzido", 1f, progress.getFloat(view), 0.001f)
  }

  @Test
  fun `native breath respects disabled system animator scale`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val previousScale = Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    val view = BreathVisualView(context)
    val update = BreathVisualView::class.java.getDeclaredMethod(
      "updateState",
      Boolean::class.javaPrimitiveType,
      String::class.java,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      String::class.java,
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val progress = BreathVisualView::class.java.getDeclaredField("motionProgress").apply { isAccessible = true }
    val animator = BreathVisualView::class.java.getDeclaredField("motionAnimator").apply { isAccessible = true }

    Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 0f)
    try {
      update.invoke(view, false, "INSPIRE", 2, 4, Color.CYAN, 0, "inspire", true)
      assertEquals("movimento reduzido do Android não agenda interpolador", null, animator.get(view))
      assertEquals("movimento reduzido deve manter o quadro inicial estático da fase", 0f, progress.getFloat(view), 0.001f)
    } finally {
      Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, previousScale)
    }
  }

  @Test
  fun `native breath respects app reduced motion preference independently of system scale`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val previousScale = Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    val view = BreathVisualView(context)
    val setReducedMotion = BreathVisualView::class.java.declaredMethods
      .singleOrNull { it.name == "setAppReducedMotion" }
    assertNotNull("a preferência local precisa alcançar a view nativa", setReducedMotion)
    val update = BreathVisualView::class.java.getDeclaredMethod(
      "updateState",
      Boolean::class.javaPrimitiveType,
      String::class.java,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      String::class.java,
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val progress = BreathVisualView::class.java.getDeclaredField("motionProgress").apply { isAccessible = true }
    val animator = BreathVisualView::class.java.getDeclaredField("motionAnimator").apply { isAccessible = true }

    Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    try {
      setReducedMotion!!.invoke(view, true)
      update.invoke(view, false, "INSPIRE", 2, 4, Color.CYAN, 0, "inspire", true)
      assertEquals("preferência do app também precisa desativar o interpolador", null, animator.get(view))
      assertEquals("movimento reduzido deve manter o quadro inicial estático da fase", 0f, progress.getFloat(view), 0.001f)
    } finally {
      Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, previousScale)
    }
  }

  @Test
  fun `native breath reduced motion holds a fixed frame across engine ticks`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val view = BreathVisualView(context)
    BreathVisualView::class.java.getDeclaredMethod("setAppReducedMotion", Boolean::class.javaPrimitiveType)
      .invoke(view, true)
    val update = BreathVisualView::class.java.getDeclaredMethod(
      "updateState",
      Boolean::class.javaPrimitiveType,
      String::class.java,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      String::class.java,
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val progress = BreathVisualView::class.java.getDeclaredField("motionProgress").apply { isAccessible = true }
    val animator = BreathVisualView::class.java.getDeclaredField("motionAnimator").apply { isAccessible = true }

    update.invoke(view, false, "INSPIRE", 3, 4, Color.CYAN, 0, "inspire", true)
    val phaseFrame = progress.getFloat(view)
    update.invoke(view, false, "INSPIRE", 2, 4, Color.CYAN, 0, "inspire", true)

    assertEquals("a fase reduzida usa o quadro estático inicial", 0f, phaseFrame, 0.001f)
    assertEquals("o quadro não pode avançar a cada tick", phaseFrame, progress.getFloat(view), 0.001f)
    assertEquals("movimento reduzido não agenda interpolação", null, animator.get(view))
  }

  @Test
  fun `native reduced motion box keeps only the static track`() {
    class PathCountingCanvas(bitmap: Bitmap) : Canvas(bitmap) {
      var pathDraws = 0
      override fun drawPath(path: Path, paint: Paint) {
        pathDraws++
      }
    }

    val context = ApplicationProvider.getApplicationContext<Context>()
    val previousScale = Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    val view = BreathVisualView(context)
    val setReducedMotion = BreathVisualView::class.java.getDeclaredMethod(
      "setAppReducedMotion",
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val update = BreathVisualView::class.java.getDeclaredMethod(
      "updateState",
      Boolean::class.javaPrimitiveType,
      String::class.java,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      Int::class.javaPrimitiveType,
      String::class.java,
      Boolean::class.javaPrimitiveType
    ).apply { isAccessible = true }
    val draw = BreathVisualView::class.java.getDeclaredMethod("onDraw", Canvas::class.java)
      .apply { isAccessible = true }

    Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f)
    try {
      view.layout(0, 0, 200, 200)
      fun activePathDraws() = PathCountingCanvas(Bitmap.createBitmap(200, 200, Bitmap.Config.ARGB_8888)).also {
        draw.invoke(view, it)
      }.pathDraws

      setReducedMotion.invoke(view, true)
      update.invoke(view, true, "SEGURE", 3, 4, Color.CYAN, 1, "hold1", true)
      assertEquals(
        "preferência do app deve manter a trilha Caixa neutra, como a WebView",
        0,
        activePathDraws()
      )

      setReducedMotion.invoke(view, false)
      Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 0f)
      update.invoke(view, true, "SEGURE", 3, 4, Color.CYAN, 1, "hold1", true)
      assertEquals("escala do sistema reduzida deve manter a trilha Caixa neutra", 0, activePathDraws())
    } finally {
      Settings.Global.putFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, previousScale)
    }
  }

  @Test
  fun `native breath accessibility label describes phase without announcing every second`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val root = createExpandedOverlay(context)
    val state = JSONObject()
      .put("status", "running")
      .put("currentStepIndex", 0)
      .put("stepTimeLeft", 4)
      .put("steps", JSONArray().put(JSONObject().put("title", "Inspirar").put("badge", "INSPIRE").put("phase", "inspire").put("duration", 4)))
      .put("session", JSONObject().put("type", "breath").put("patternKey", "longa").put("programTitle", "Respiração Longa").put("phaseTitle", "Respiração"))

    bindOverlayState(context, state)
    val breathView = overlayViews(root).filterIsInstance<BreathVisualView>().single()
    val description = breathView.contentDescription.toString()
    assertTrue("TalkBack deve anunciar a fase", description.contains("INSPIRE"))
    assertFalse("o texto acessível não deve mudar a cada segundo", description.contains("00:04"))
  }

  @Test
  fun `expanded breathing actions expose 48dp targets and readable labels`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val root = createExpandedOverlay(context)
    bindOverlayState(
      context,
      JSONObject()
        .put("status", "running")
        .put("currentStepIndex", 0)
        .put("stepTimeLeft", 4)
        .put("steps", JSONArray().put(JSONObject().put("title", "Inspirar").put("badge", "INSPIRE").put("phase", "inspire").put("duration", 4)))
        .put("session", JSONObject().put("type", "breath").put("patternKey", "longa").put("programTitle", "Respiração Longa").put("phaseTitle", "Respiração"))
    )
    val controls = overlayViews(root).filterIsInstance<TextView>().filter {
      it.contentDescription in setOf("Pausar treino", "Pular para o próximo passo", "Cancelar treino")
    }
    assertEquals("pausa, pulo e cancelamento devem continuar distintos", 3, controls.size)

    controls.forEach { button ->
      val actualDp = button.minHeight / context.resources.displayMetrics.density
      assertTrue("${button.contentDescription} precisa ter alvo de 48dp (medido ${button.minHeight}px / ${context.resources.displayMetrics.density} = ${actualDp}dp)", actualDp >= 48f)
      val background = button.background as? android.graphics.drawable.GradientDrawable
      val backgroundColor = background?.color?.defaultColor
      assertNotNull("${button.contentDescription} precisa manter fundo sólido para verificar contraste", backgroundColor)
      assertTrue(
        "${button.contentDescription} precisa de contraste textual mínimo 4.5:1",
        ColorUtils.calculateContrast(button.currentTextColor, backgroundColor!!) >= 4.5
      )
    }
  }

  @Test
  fun `mini compact collapse and safe exit actions keep 48dp targets`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val density = context.resources.displayMetrics.density
    fun assert48(view: TextView?, label: String) {
      assertNotNull("$label precisa existir", view)
      assertTrue("$label precisa ter alvo de 48dp", view!!.minHeight / density >= 48f)
    }

    val mini = buildOverlayPart(context, "buildMiniView")
    assert48(overlayViews(mini).filterIsInstance<TextView>().firstOrNull { it.contentDescription == "Abrir controles do treino" }, "Abrir no modo mini")

    val compact = buildOverlayPart(context, "buildCompactView")
    val compactButtons = overlayViews(compact).filterIsInstance<TextView>().filter {
      it.contentDescription in setOf("Pausar treino", "Cancelar treino")
    }
    assertEquals("modo compacto deve ter Pausar e Cancelar", 2, compactButtons.size)
    compactButtons.forEach { assert48(it, it.contentDescription.toString()) }

    val expanded = createExpandedOverlay(context)
    bindOverlayState(
      context,
      JSONObject()
        .put("status", "running")
        .put("currentStepIndex", 0)
        .put("stepTimeLeft", 15)
        .put("steps", JSONArray().put(JSONObject().put("title", "Retenção").put("phase", "vacuo").put("duration", 30)))
        .put("session", JSONObject().put("type", "vacuo").put("programTitle", "Vácuo").put("phaseTitle", "Retenção"))
    )
    val expandedViews = overlayViews(expanded).filterIsInstance<TextView>()
    assert48(expandedViews.firstOrNull { it.contentDescription == "Recolher modo expandido" }, "Recolher expandido")
    assert48(expandedViews.firstOrNull { it.contentDescription == "Encerrar retenção de vácuo com segurança e iniciar recuperação" }, "Saída segura de retenção")
  }

  @Test
  fun `native atlas crop contains pixels from only the requested quadrant`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val loadBitmap = WorkoutOverlayController::class.java.getDeclaredMethod(
      "loadExerciseGuideBitmap",
      Context::class.java,
      String::class.java,
      Int::class.javaObjectType
    ).apply { isAccessible = true }

    for (cardId in 1..4) {
      val path = "img/pausas/stretch-sequence-$cardId.png"
      val source = context.assets.open(path).use { stream ->
        BitmapFactory.decodeStream(stream, null, BitmapFactory.Options().apply { inSampleSize = 2 })
      } ?: error("Atlas $cardId não decodificou")
      val cellWidth = source.width / 2
      val cellHeight = source.height / 2

      for (frame in 0..3) {
        val cropped = loadBitmap.invoke(WorkoutOverlayController, context, path, frame) as? android.graphics.Bitmap
        assertNotNull("Atlas $cardId precisa recortar o quadro $frame", cropped)
        assertEquals(cellWidth, cropped!!.width)
        assertEquals(cellHeight, cropped.height)
        val startX = (frame % 2) * cellWidth
        val startY = (frame / 2) * cellHeight
        for (xFraction in listOf(0.1f, 0.5f, 0.9f)) {
          for (yFraction in listOf(0.1f, 0.5f, 0.9f)) {
            val x = (cellWidth * xFraction).toInt().coerceIn(0, cellWidth - 1)
            val y = (cellHeight * yFraction).toInt().coerceIn(0, cellHeight - 1)
            assertEquals(
              "Atlas $cardId, quadro $frame deve conter os pixels da célula solicitada",
              source.getPixel(startX + x, startY + y),
              cropped.getPixel(x, y)
            )
          }
        }
      }
      source.recycle()
    }
  }

  @Test
  fun `native stretch sequence follows engine time and changes to its own opposite side frame`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val root = createExpandedOverlay(context)
    val image = overlayViews(root).filterIsInstance<ImageView>().single()
    val views = overlayViews(root).filterIsInstance<TextView>()
    val phase = views.firstOrNull { it.contentDescription == "Fase do alongamento" }
    assertNotNull("O overlay deve expor a fase corporal", phase)

    fun bind(timeLeft: Int, status: String = "running") = bindOverlayState(
      context,
      stateWithImage(
        "img/pausas/stretch-sequence-1.png",
        cardId = 1,
        timeLeft = timeLeft,
        status = status
      )
    )

    bind(60)
    assertEquals("Preparar · Direita", phase!!.text.toString())
    assertTrue(image.contentDescription.toString().contains("direita", ignoreCase = true))

    bind(30)
    assertEquals("Preparar · Esquerda", phase.text.toString())
    assertTrue("O lado esquerdo deve ter descrição própria", image.contentDescription.toString().contains("esquerda", ignoreCase = true))

    bind(26)
    assertEquals("Preparar · Esquerda", phase.text.toString())
    bind(23)
    assertEquals("Preparar · Esquerda", phase.text.toString())
    bind(22)
    assertEquals("Movimento suave · Esquerda", phase.text.toString())
    bind(18)
    assertEquals("Manter · Esquerda", phase.text.toString())
    val heldImage = image.contentDescription
    bind(18, status = "paused")
    assertEquals("Pausar congela o quadro de postura", heldImage, image.contentDescription)

    bind(3)
    assertEquals("Retornar · Esquerda", phase.text.toString())
  }

  @Test
  fun `native stretch frames match anatomical side labels in all asymmetric atlases`() {
    for (cardId in listOf(1, 2, 4)) {
      assertEquals("Exercício $cardId deve mostrar a direita indicada", 2 to "Direita", stretchGuideCue(cardId, 60, 52))
      assertEquals("Exercício $cardId deve mostrar a esquerda indicada", 1 to "Esquerda", stretchGuideCue(cardId, 60, 22))
    }
    assertEquals("O exercício contínuo mantém sua sequência sem lados", 1 to "Contínuo", stretchGuideCue(3, 60, 48))
  }

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

  @Test
  fun `overlay position coordinates persist and load correctly`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val (defaultX, defaultY) = WorkoutOverlayController.getSavedPosition(context)
    assertEquals(WorkoutOverlayController.DEFAULT_POS_X, defaultX)
    assertEquals(WorkoutOverlayController.DEFAULT_POS_Y, defaultY)

    WorkoutOverlayController.savePosition(context, 150, 420)
    val (updatedX, updatedY) = WorkoutOverlayController.getSavedPosition(context)
    assertEquals(150, updatedX)
    assertEquals(420, updatedY)
  }

  @Test
  fun `overlay preferences JSON includes position coordinates`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val json = """
      {
        "enabled": true,
        "defaultSize": "mini",
        "autoCollapse": true,
        "showNextStep": true,
        "positionX": 80,
        "positionY": 300
      }
    """.trimIndent()

    WorkoutOverlayController.savePreferences(context, json)
    val prefs = WorkoutOverlayController.loadPreferences(context)
    assertEquals(80, prefs.positionX)
    assertEquals(300, prefs.positionY)
  }
}

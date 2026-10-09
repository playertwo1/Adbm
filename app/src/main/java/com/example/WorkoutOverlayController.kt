package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import androidx.core.graphics.ColorUtils
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject
import kotlin.math.hypot

/**
 * Controlador da Sobreposição Flutuante (Modo Treino Flutuante) do CoreFlow.
 *
 * Exibe a sessão cronometrada atual sobre outros aplicativos Android usando
 * um overlay nativo (SYSTEM_ALERT_WINDOW).
 *
 * REGRAS INEGOCIÁVEIS:
 * - O overlay é estritamente passivo em relação ao cronômetro: NÃO possui timer próprio,
 *   CountDownTimer, setInterval ou loop temporal.
 * - WorkoutForegroundService continua sendo a fonte única da verdade.
 * - Proibido disparar vibração própria, duplicar voz ou sinais do Wear OS.
 * - Negar a permissão de overlay NUNCA impede o treino normal.
 */
object WorkoutOverlayController {

    enum class VisualState {
        MINI,
        COMPACT,
        EXPANDED
    }

    data class OverlayPreferences(
        val enabled: Boolean = false,
        val defaultSize: String = "compact", // "compact" ou "mini"
        val autoCollapse: Boolean = true,
        val showNextStep: Boolean = true,
        val positionX: Int = DEFAULT_POS_X,
        val positionY: Int = DEFAULT_POS_Y
    ) {
        fun toJson(): JSONObject = JSONObject().apply {
            put("enabled", enabled)
            put("defaultSize", defaultSize)
            put("autoCollapse", autoCollapse)
            put("showNextStep", showNextStep)
            put("positionX", positionX)
            put("positionY", positionY)
        }

        companion object {
            fun fromJson(json: JSONObject): OverlayPreferences = OverlayPreferences(
                enabled = json.optBoolean("enabled", false),
                defaultSize = when (json.optString("defaultSize")) {
                    SIZE_MINI -> SIZE_MINI
                    SIZE_EXPANDED -> SIZE_EXPANDED
                    else -> SIZE_COMPACT
                },
                autoCollapse = json.optBoolean("autoCollapse", true),
                showNextStep = json.optBoolean("showNextStep", true),
                positionX = json.optInt("positionX", DEFAULT_POS_X),
                positionY = json.optInt("positionY", DEFAULT_POS_Y)
            )
        }
    }

    const val SIZE_MINI = "mini"
    const val SIZE_COMPACT = "compact"
    const val SIZE_EXPANDED = "expanded"

    const val PREFS_NAME = "coreflow_overlay_prefs"
    const val KEY_ENABLED = "overlay_enabled"
    const val KEY_DEFAULT_SIZE = "overlay_default_size"
    const val KEY_AUTO_COLLAPSE = "overlay_auto_collapse"
    const val KEY_SHOW_NEXT_STEP = "overlay_show_next_step"
    const val KEY_POSITION_X = "overlay_position_x"
    const val KEY_POSITION_Y = "overlay_position_y"
    const val DEFAULT_POS_X = 24
    const val DEFAULT_POS_Y = 120
    private const val AUTO_COLLAPSE_DELAY_MS = 5_000L

    private var windowManager: WindowManager? = null
    private var rootView: FrameLayout? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    // Sub-views para os 3 estados visuais (Material 3 + AMOLED)
    private var miniContainer: LinearLayout? = null
    private var compactContainer: LinearLayout? = null
    private var expandedContainer: LinearLayout? = null

    // Referências aos elementos dinâmicos do Mini
    private var miniIconBadge: TextView? = null
    private var miniTimerText: TextView? = null

    // Referências aos elementos dinâmicos do Compacto
    private var compactIconBadge: TextView? = null
    private var compactActionText: TextView? = null
    private var compactProgramText: TextView? = null
    private var compactTimerText: TextView? = null

    // Referências aos elementos dinâmicos do Expandido
    private var expandedProgramTitle: TextView? = null
    private var expandedPhaseSubtitle: TextView? = null
    private var expandedActionTitle: TextView? = null
    private var expandedTimerText: TextView? = null
    private var expandedTotalTimeText: TextView? = null
    private var expandedExerciseImage: ImageView? = null
    private var breathVisualView: BreathVisualView? = null
    private var expandedNextStepCard: LinearLayout? = null
    private var expandedNextStepLabel: TextView? = null
    private var expandedPauseResumeBtn: TextView? = null
    private var expandedSkipBtn: TextView? = null
    private var expandedSafeExitBtn: TextView? = null

    private var currentState: VisualState = VisualState.COMPACT
    private var lastRawState: JSONObject? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var autoCollapseRunnable: Runnable? = null

    // Rastreamento de arrasto (drag & snap to edge)
    private var isDragging = false
    private var initialX = 0
    private var initialY = 0
    private var touchStartX = 0f
    private var touchStartY = 0f

    fun canDrawOverlays(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    fun requestOverlayPermission(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }

    fun getPreferences(context: Context): OverlayPreferences {
        val sp = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val size = when (val raw = sp.getString(KEY_DEFAULT_SIZE, SIZE_COMPACT)) {
            SIZE_MINI, SIZE_EXPANDED -> raw
            else -> SIZE_COMPACT
        }
        return OverlayPreferences(
            enabled = sp.getBoolean(KEY_ENABLED, false),
            defaultSize = size,
            autoCollapse = sp.getBoolean(KEY_AUTO_COLLAPSE, true),
            showNextStep = sp.getBoolean(KEY_SHOW_NEXT_STEP, true),
            positionX = sp.getInt(KEY_POSITION_X, DEFAULT_POS_X),
            positionY = sp.getInt(KEY_POSITION_Y, DEFAULT_POS_Y)
        )
    }

    fun loadPreferences(context: Context): OverlayPreferences = getPreferences(context)

    fun savePreferences(context: Context, prefs: OverlayPreferences) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ENABLED, prefs.enabled)
            .putString(KEY_DEFAULT_SIZE, prefs.defaultSize)
            .putBoolean(KEY_AUTO_COLLAPSE, prefs.autoCollapse)
            .putBoolean(KEY_SHOW_NEXT_STEP, prefs.showNextStep)
            .putInt(KEY_POSITION_X, prefs.positionX)
            .putInt(KEY_POSITION_Y, prefs.positionY)
            .apply()
    }

    fun getSavedPosition(context: Context): Pair<Int, Int> {
        val sp = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val x = sp.getInt(KEY_POSITION_X, DEFAULT_POS_X)
        val y = sp.getInt(KEY_POSITION_Y, DEFAULT_POS_Y)
        return Pair(x, y)
    }

    fun savePosition(context: Context, x: Int, y: Int) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putInt(KEY_POSITION_X, x)
            .putInt(KEY_POSITION_Y, y)
            .apply()
    }

    fun savePreferences(context: Context, jsonStr: String): Boolean = runCatching {
        val json = JSONObject(jsonStr)
        savePreferences(context, OverlayPreferences.fromJson(json))
        true
    }.getOrDefault(false)

    fun isShowing(): Boolean = rootView != null && rootView?.isAttachedToWindow == true

    fun isOverlayVisible(): Boolean = isShowing()

    fun currentVisualState(): VisualState = currentState

    /**
     * Ponto de entrada chamado por WorkoutForegroundService sempre que o estado é atualizado.
     * Consome estritamente o estado do serviço (sem timer próprio).
     */
    fun onServiceStateChanged(context: Context, stateJson: JSONObject) {
        mainHandler.post {
            lastRawState = stateJson
            val prefs = getPreferences(context)
            val status = stateJson.optString("status")

            if (!prefs.enabled || !canDrawOverlays(context) || (status != "running" && status != "paused")) {
                hideOverlay(context)
                return@post
            }

            if (rootView == null) {
                val initialMode = if (prefs.defaultSize == "mini") VisualState.MINI else VisualState.COMPACT
                createAndAttachOverlay(context, initialMode)
            }

            bindStateToViews(context, stateJson, prefs)
        }
    }

    fun hideOverlay(context: Context) {
        mainHandler.post {
            cancelAutoCollapse()
            if (rootView != null && windowManager != null) {
                runCatching { windowManager?.removeView(rootView) }
            }
            rootView = null
            windowManager = null
            miniContainer = null
            compactContainer = null
            expandedContainer = null
            expandedExerciseImage = null
            breathVisualView = null
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun createAndAttachOverlay(context: Context, initialState: VisualState) {
        currentState = initialState
        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager ?: return

        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val (savedX, savedY) = getSavedPosition(context)
        val displayMetrics = context.resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val screenHeight = displayMetrics.heightPixels
        val minMargin = dpToPx(context, 16)
        val clampedX = savedX.coerceIn(0, (screenWidth - dpToPx(context, 80)).coerceAtLeast(0))
        val clampedY = savedY.coerceIn(minMargin, (screenHeight - dpToPx(context, 100)).coerceAtLeast(minMargin))

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = clampedX
            y = clampedY
        }
        layoutParams = params

        val root = FrameLayout(context).apply {
            clipChildren = false
            clipToPadding = false
        }
        rootView = root

        buildMiniView(context, root)
        buildCompactView(context, root)
        buildExpandedView(context, root)

        // Configuração do gesto de arrasto (drag & snap to edge) e toque (alternar visual)
        val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
        root.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    cancelAutoCollapse()
                    isDragging = false
                    initialX = params.x
                    initialY = params.y
                    touchStartX = event.rawX
                    touchStartY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - touchStartX
                    val dy = event.rawY - touchStartY
                    if (!isDragging && hypot(dx.toDouble(), dy.toDouble()) > touchSlop) {
                        isDragging = true
                    }
                    if (isDragging) {
                        params.x = (initialX + dx).toInt()
                        params.y = (initialY + dy).toInt()
                        runCatching { windowManager?.updateViewLayout(root, params) }
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (isDragging) {
                        snapToNearestEdge(context, params, root)
                    } else {
                        // Foi um toque rápido: alterna tamanho
                        toggleVisualState(context)
                    }
                    isDragging = false
                    true
                }
                else -> false
            }
        }

        updateViewVisibility()
        runCatching { windowManager?.addView(root, params) }
    }

    private fun snapToNearestEdge(context: Context, params: WindowManager.LayoutParams, view: View) {
        val displayMetrics = context.resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val screenHeight = displayMetrics.heightPixels
        val viewWidth = view.width.coerceAtLeast(100)
        val viewHeight = view.height.coerceAtLeast(60)
        val margin = dpToPx(context, 16)
        val targetX = if (params.x + viewWidth / 2 < screenWidth / 2) {
            margin
        } else {
            (screenWidth - viewWidth - margin).coerceAtLeast(0)
        }
        val targetY = params.y.coerceIn(margin, (screenHeight - viewHeight - margin).coerceAtLeast(margin))
        params.x = targetX
        params.y = targetY
        runCatching { windowManager?.updateViewLayout(view, params) }
        savePosition(context, targetX, targetY)
        scheduleAutoCollapse(context)
    }

    private fun toggleVisualState(context: Context) {
        val prefs = getPreferences(context)
        currentState = when (currentState) {
            VisualState.MINI -> VisualState.EXPANDED
            VisualState.COMPACT -> VisualState.EXPANDED
            VisualState.EXPANDED -> if (prefs.defaultSize == "mini") VisualState.MINI else VisualState.COMPACT
        }
        updateViewVisibility()
        lastRawState?.let { bindStateToViews(context, it, prefs) }
    }

    private fun setVisualState(context: Context, newState: VisualState) {
        if (currentState == newState) return
        currentState = newState
        updateViewVisibility()
        lastRawState?.let { bindStateToViews(context, it, getPreferences(context)) }
    }

    private fun updateViewVisibility() {
        miniContainer?.visibility = if (currentState == VisualState.MINI) View.VISIBLE else View.GONE
        compactContainer?.visibility = if (currentState == VisualState.COMPACT) View.VISIBLE else View.GONE
        expandedContainer?.visibility = if (currentState == VisualState.EXPANDED) View.VISIBLE else View.GONE
        rootView?.let { root ->
            layoutParams?.let { lp ->
                runCatching { windowManager?.updateViewLayout(root, lp) }
            }
        }
    }

    private fun scheduleAutoCollapse(context: Context) {
        cancelAutoCollapse()
        val prefs = getPreferences(context)
        if (currentState == VisualState.EXPANDED && prefs.autoCollapse) {
            autoCollapseRunnable = Runnable {
                setVisualState(context, if (prefs.defaultSize == "mini") VisualState.MINI else VisualState.COMPACT)
            }.also { mainHandler.postDelayed(it, AUTO_COLLAPSE_DELAY_MS) }
        }
    }

    private fun cancelAutoCollapse() {
        autoCollapseRunnable?.let { mainHandler.removeCallbacks(it) }
        autoCollapseRunnable = null
    }

    /* -------------------------------------------------------------
       CONSTRUÇÃO DA INTERFACE NATIVA (MATERIAL DESIGN 3 / AMOLED)
    ------------------------------------------------------------- */

    private fun buildMiniView(context: Context, root: FrameLayout) {
        miniContainer = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dpToPx(context, 6), dpToPx(context, 4), dpToPx(context, 10), dpToPx(context, 4))
            background = createPillDrawable(Color.parseColor("#0B0F19"), Color.parseColor("#10B981"), 1)
            contentDescription = "Treino ativo flutuante, modo mini. Toque para alternar tamanho."
        }

        miniIconBadge = TextView(context).apply {
            text = "◉"
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#10B981"))
            setPadding(0, 0, dpToPx(context, 6), 0)
        }
        miniTimerText = TextView(context).apply {
            text = "00:00"
            textSize = 13f
            typeface = Typeface.MONOSPACE
            setTextColor(Color.WHITE)
        }

        miniContainer?.addView(miniIconBadge)
        miniContainer?.addView(miniTimerText)
        root.addView(miniContainer)
    }

    private fun buildCompactView(context: Context, root: FrameLayout) {
        compactContainer = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dpToPx(context, 8), dpToPx(context, 6), dpToPx(context, 8), dpToPx(context, 6))
            background = createPillDrawable(Color.parseColor("#0B0F19"), Color.parseColor("#1E293B"), 1)
            contentDescription = "Treino ativo flutuante, modo compacto. Toque para alternar tamanho."
        }

        compactIconBadge = TextView(context).apply {
            text = "◉"
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#10B981"))
            setPadding(dpToPx(context, 4), 0, dpToPx(context, 8), 0)
        }

        val textCol = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
        }

        compactActionText = TextView(context).apply {
            text = "TREINO"
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
        }
        compactProgramText = TextView(context).apply {
            text = "CoreFlow"
            textSize = 9f
            setTextColor(Color.parseColor("#94A3B8"))
        }
        textCol.addView(compactActionText)
        textCol.addView(compactProgramText)

        compactTimerText = TextView(context).apply {
            text = "00:00"
            textSize = 13f
            typeface = Typeface.MONOSPACE
            setTextColor(Color.parseColor("#10B981"))
            setPadding(dpToPx(context, 8), dpToPx(context, 3), dpToPx(context, 8), dpToPx(context, 3))
            background = createPillDrawable(Color.parseColor("#111827"), Color.parseColor("#10B981"), 1)
        }

        val spacer = View(context).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(context, 10), 0)
        }

        compactContainer?.addView(compactIconBadge)
        compactContainer?.addView(textCol)
        compactContainer?.addView(spacer)
        compactContainer?.addView(compactTimerText)
        root.addView(compactContainer)
    }

    private fun buildExpandedView(context: Context, root: FrameLayout) {
        val widthPx = dpToPx(context, 280)
        expandedContainer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = FrameLayout.LayoutParams(widthPx, FrameLayout.LayoutParams.WRAP_CONTENT)
            setPadding(dpToPx(context, 14), dpToPx(context, 12), dpToPx(context, 14), dpToPx(context, 12))
            background = createCardDrawable(Color.parseColor("#0B0F19"), Color.parseColor("#1E293B"), dpToPx(context, 20).toFloat())
        }

        // Header: Ícone + Título do Programa + Botão recolher
        val header = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        val headerTexts = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        expandedProgramTitle = TextView(context).apply {
            text = "VÁCUO ABDOMINAL"
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
        }
        expandedPhaseSubtitle = TextView(context).apply {
            text = "Semana 1 · Série 1/3"
            textSize = 10f
            setTextColor(Color.parseColor("#94A3B8"))
        }
        headerTexts.addView(expandedProgramTitle)
        headerTexts.addView(expandedPhaseSubtitle)

        val collapseBtn = TextView(context).apply {
            text = "✕"
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#94A3B8"))
            contentDescription = "Recolher modo expandido"
            setPadding(dpToPx(context, 6), dpToPx(context, 4), dpToPx(context, 6), dpToPx(context, 4))
            setOnClickListener {
                cancelAutoCollapse()
                setVisualState(context, if (getPreferences(context).defaultSize == "mini") VisualState.MINI else VisualState.COMPACT)
            }
        }
        header.addView(headerTexts)
        header.addView(collapseBtn)
        expandedContainer?.addView(header)

        // Divisor sutil
        val divider = View(context).apply {
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 1).apply {
                topMargin = dpToPx(context, 8)
                bottomMargin = dpToPx(context, 8)
            }
            setBackgroundColor(Color.parseColor("#1E293B"))
        }
        expandedContainer?.addView(divider)

        // Visualização Dedicada de Respiração (Em Caixa com traço ou Respirações com pulso)
        breathVisualView = BreathVisualView(context).apply {
            layoutParams = LinearLayout.LayoutParams(
                dpToPx(context, 140),
                dpToPx(context, 140)
            ).apply {
                gravity = Gravity.CENTER_HORIZONTAL
                topMargin = dpToPx(context, 4)
                bottomMargin = dpToPx(context, 8)
            }
            visibility = View.GONE
        }
        expandedContainer?.addView(breathVisualView)

        // Corpo central: Ação Atual + Cronômetro Grande
        expandedActionTitle = TextView(context).apply {
            text = "RETENÇÃO"
            textSize = 13f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#10B981"))
            gravity = Gravity.CENTER
            setPadding(0, dpToPx(context, 2), 0, dpToPx(context, 2))
        }
        expandedContainer?.addView(expandedActionTitle)

        expandedTimerText = TextView(context).apply {
            text = "00:14"
            textSize = 28f
            typeface = Typeface.MONOSPACE
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        }
        expandedContainer?.addView(expandedTimerText)

        expandedTotalTimeText = TextView(context).apply {
            text = "de 30s"
            textSize = 10f
            setTextColor(Color.parseColor("#64748B"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dpToPx(context, 6))
        }
        expandedContainer?.addView(expandedTotalTimeText)

        // Imagem da Postura Biomecânica (Bracing McGill e exercícios com guia)
        expandedExerciseImage = ImageView(context).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dpToPx(context, 120)
            ).apply {
                topMargin = dpToPx(context, 2)
                bottomMargin = dpToPx(context, 8)
            }
            scaleType = ImageView.ScaleType.FIT_CENTER
            background = createCardDrawable(Color.parseColor("#090D16"), Color.parseColor("#1E293B"), dpToPx(context, 12).toFloat())
            setPadding(dpToPx(context, 6), dpToPx(context, 6), dpToPx(context, 6), dpToPx(context, 6))
            clipToOutline = true
            visibility = View.GONE
        }
        expandedContainer?.addView(expandedExerciseImage)

        // Card do Próximo Passo
        expandedNextStepCard = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dpToPx(context, 10), dpToPx(context, 6), dpToPx(context, 10), dpToPx(context, 6))
            background = createCardDrawable(Color.parseColor("#111827"), Color.parseColor("#1E293B"), dpToPx(context, 10).toFloat())
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                bottomMargin = dpToPx(context, 10)
            }
        }
        expandedNextStepLabel = TextView(context).apply {
            text = "➔ Próximo: Recuperação · 60s"
            textSize = 10f
            setTextColor(Color.parseColor("#94A3B8"))
        }
        expandedNextStepCard?.addView(expandedNextStepLabel)
        expandedContainer?.addView(expandedNextStepCard)

        // Barra de Controles (CP4): Pausar/Continuar, Pular/Próximo e Saída Segura
        val controlsBar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }

        expandedPauseResumeBtn = TextView(context).apply {
            text = "⏸ Pausar"
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#0F172A"))
            contentDescription = "Pausar ou continuar treino"
            gravity = Gravity.CENTER
            background = createPillDrawable(Color.parseColor("#10B981"), Color.parseColor("#10B981"), 0)
            setPadding(dpToPx(context, 14), dpToPx(context, 8), dpToPx(context, 14), dpToPx(context, 8))
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                rightMargin = dpToPx(context, 6)
            }
            setOnClickListener {
                val isPaused = lastRawState?.optString("status") == "paused"
                val action = if (isPaused) WorkoutForegroundService.ACTION_RESUME else WorkoutForegroundService.ACTION_PAUSE
                sendServiceAction(context, action)
                scheduleAutoCollapse(context)
            }
        }

        expandedSkipBtn = TextView(context).apply {
            text = "⏭ Pular"
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.WHITE)
            contentDescription = "Pular para o próximo passo"
            gravity = Gravity.CENTER
            background = createPillDrawable(Color.parseColor("#1E293B"), Color.parseColor("#334155"), 1)
            setPadding(dpToPx(context, 12), dpToPx(context, 8), dpToPx(context, 12), dpToPx(context, 8))
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                leftMargin = dpToPx(context, 6)
            }
            setOnClickListener {
                sendServiceAction(context, WorkoutForegroundService.ACTION_SKIP)
                scheduleAutoCollapse(context)
            }
        }

        controlsBar.addView(expandedPauseResumeBtn)
        controlsBar.addView(expandedSkipBtn)
        expandedContainer?.addView(controlsBar)

        // Botão especial: Saída Segura da Retenção (quando em retenção de Vácuo)
        expandedSafeExitBtn = TextView(context).apply {
            text = "Encerrar Retenção com Segurança"
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(Color.parseColor("#F59E0B"))
            contentDescription = "Encerrar retenção de vácuo com segurança e iniciar recuperação"
            gravity = Gravity.CENTER
            background = createCardDrawable(Color.parseColor("#1A1607"), Color.parseColor("#F59E0B"), dpToPx(context, 8).toFloat())
            setPadding(dpToPx(context, 8), dpToPx(context, 6), dpToPx(context, 8), dpToPx(context, 6))
            layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                topMargin = dpToPx(context, 8)
            }
            visibility = View.GONE
            setOnClickListener {
                sendServiceAction(context, WorkoutForegroundService.ACTION_SAFE_EXIT_RETENTION)
                scheduleAutoCollapse(context)
            }
        }
        expandedContainer?.addView(expandedSafeExitBtn)

        // Toque no cabeçalho/título reabre o aplicativo
        headerTexts.apply {
            contentDescription = "Toque para abrir o aplicativo CoreFlow"
            setOnClickListener {
                openMainActivity(context)
            }
        }

        root.addView(expandedContainer)
    }

    /* -------------------------------------------------------------
       ATUALIZAÇÃO DE DADOS VINDO DO FOREGROUND SERVICE (CP2)
    ------------------------------------------------------------- */

    private fun bindStateToViews(context: Context, state: JSONObject, prefs: OverlayPreferences) {
        val status = state.optString("status")
        val isPaused = status == "paused"
        val stepTimeLeft = state.optInt("stepTimeLeft", 0)
        val currentStepIndex = state.optInt("currentStepIndex", 0)
        val stepsArray = state.optJSONArray("steps")
        val sessionMeta = state.optJSONObject("session") ?: JSONObject()

        val currentStep = stepsArray?.optJSONObject(currentStepIndex)
        val nextStep = stepsArray?.optJSONObject(currentStepIndex + 1)

        val duration = currentStep?.optInt("duration", 0) ?: 0
        val isRest = currentStep?.optBoolean("isRest", false) ?: false
        val phase = currentStep?.optString("phase", "").orEmpty()
        val badge = currentStep?.optString("badge", "").orEmpty()
        val title = currentStep?.optString("title", "Treino") ?: "Treino"
        val series = currentStep?.optInt("series", 0) ?: 0

        val programTitle = sessionMeta.optString("programTitle", "CoreFlow")
        val phaseTitle = sessionMeta.optString("phaseTitle", "")

        val timeStr = formatTime(stepTimeLeft)
        val totalTimeStr = if (duration > 0) "de ${duration}s" else ""

        // Identificação de paleta de cores
        val accentColor = resolveThemeColor(programTitle, phase, isRest)

        val actionLabel = when {
            badge.isNotBlank() -> badge
            isRest -> "DESCANSO"
            else -> title
        }

        // 1. Atualizar MINI
        miniTimerText?.text = timeStr
        miniIconBadge?.setTextColor(accentColor)
        miniContainer?.background = createPillDrawable(Color.parseColor("#0B0F19"), accentColor, 1)
        miniContainer?.contentDescription = "$programTitle, $actionLabel, restante $timeStr. Toque para alternar tamanho."

        // 2. Atualizar COMPACTO
        compactTimerText?.text = timeStr
        compactTimerText?.setTextColor(accentColor)
        compactTimerText?.background = createPillDrawable(Color.parseColor("#111827"), accentColor, 1)
        compactIconBadge?.setTextColor(accentColor)
        compactActionText?.text = actionLabel
        val seriesText = if (series > 0) " · Série $series" else ""
        compactProgramText?.text = "$programTitle$seriesText"
        compactContainer?.contentDescription = "$programTitle, $actionLabel, restante $timeStr. Toque para alternar tamanho."

        // 3. Atualizar EXPANDIDO
        expandedProgramTitle?.text = programTitle.uppercase()
        expandedPhaseSubtitle?.text = if (phaseTitle.isNotBlank()) phaseTitle else "$programTitle$seriesText"

        val isBreath = sessionMeta.optString("type") == "breath" || programTitle.contains("Respiração", ignoreCase = true)
        if (isBreath) {
            val patternKey = sessionMeta.optString("patternKey", "")
            val isBox = patternKey == "caixa" || phaseTitle.contains("Caixa", ignoreCase = true)
            breathVisualView?.visibility = View.VISIBLE
            breathVisualView?.updateState(isBox, actionLabel, stepTimeLeft, duration, accentColor, currentStepIndex)
            breathVisualView?.contentDescription = "Visual da respiração $actionLabel. Tempo restante: $timeStr"
            expandedActionTitle?.visibility = View.GONE
            expandedTimerText?.visibility = View.GONE
            expandedTotalTimeText?.visibility = View.GONE
            expandedExerciseImage?.visibility = View.GONE
        } else {
            breathVisualView?.visibility = View.GONE
            expandedActionTitle?.visibility = View.VISIBLE
            expandedActionTitle?.text = actionLabel
            expandedActionTitle?.setTextColor(accentColor)
            expandedTimerText?.visibility = View.VISIBLE
            expandedTimerText?.text = timeStr
            expandedTotalTimeText?.visibility = View.VISIBLE
            expandedTotalTimeText?.text = totalTimeStr

            val imagePath = currentStep?.optString("image", "").orEmpty()
            if (imagePath.isNotBlank()) {
                try {
                    context.assets.open(imagePath).use { stream ->
                        val bmp = BitmapFactory.decodeStream(stream)
                        if (bmp != null) {
                            expandedExerciseImage?.setImageBitmap(bmp)
                            expandedExerciseImage?.contentDescription = "Postura correta para o exercício $title"
                            expandedExerciseImage?.visibility = View.VISIBLE
                        } else {
                            expandedExerciseImage?.visibility = View.GONE
                        }
                    }
                } catch (_: Exception) {
                    expandedExerciseImage?.visibility = View.GONE
                }
            } else {
                expandedExerciseImage?.visibility = View.GONE
            }
        }
        expandedContainer?.contentDescription = "Card expandido do treino. $programTitle, $actionLabel, restante $timeStr."

        // Botão Pausar / Continuar
        if (isPaused) {
            expandedPauseResumeBtn?.text = "▶ Continuar"
            expandedPauseResumeBtn?.contentDescription = "Continuar treino"
            expandedPauseResumeBtn?.background = createPillDrawable(Color.parseColor("#10B981"), Color.parseColor("#10B981"), 0)
        } else {
            expandedPauseResumeBtn?.text = "⏸ Pausar"
            expandedPauseResumeBtn?.contentDescription = "Pausar treino"
            expandedPauseResumeBtn?.background = createPillDrawable(Color.parseColor("#F59E0B"), Color.parseColor("#F59E0B"), 0)
        }

        // Próximo passo
        if (prefs.showNextStep && nextStep != null) {
            expandedNextStepCard?.visibility = View.VISIBLE
            val nextTitle = nextStep.optString("title", "Próximo passo")
            val nextDuration = nextStep.optInt("duration", 0)
            val durLabel = if (nextDuration > 0) " · ${nextDuration}s" else ""
            expandedNextStepLabel?.text = "➔ Próximo: $nextTitle$durLabel"
        } else {
            expandedNextStepCard?.visibility = View.GONE
        }

        // Saída segura da retenção
        if (phase == "vacuo" && !isRest) {
            expandedSafeExitBtn?.visibility = View.VISIBLE
        } else {
            expandedSafeExitBtn?.visibility = View.GONE
        }

        scheduleAutoCollapse(context)
    }

    private fun sendServiceAction(context: Context, action: String) {
        val intent = Intent(context, WorkoutForegroundService::class.java).apply {
            this.action = action
        }
        context.startService(intent)
    }

    private fun openMainActivity(context: Context) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        context.startActivity(intent)
    }

    fun formatTime(seconds: Int): String {
        val m = seconds / 60
        val s = seconds % 60
        return "%02d:%02d".format(m, s)
    }

    fun resolveThemeColor(programTitle: String, phase: String, isRest: Boolean = false): Int {
        return when {
            phase == "vacuo" -> Color.parseColor("#10B981") // Esmeralda
            isRest || phase == "recuperacao" -> Color.parseColor("#0EA5E9") // Sky / Azul
            programTitle.contains("Kegel", ignoreCase = true) -> Color.parseColor("#A855F7") // Roxo
            programTitle.contains("Bracing", ignoreCase = true) -> Color.parseColor("#F59E0B") // Âmbar
            programTitle.contains("Respiração", ignoreCase = true) -> Color.parseColor("#06B6D4") // Ciano
            else -> Color.parseColor("#10B981")
        }
    }

    private fun dpToPx(context: Context, dp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            context.resources.displayMetrics
        ).toInt()
    }

    private fun createPillDrawable(bgColor: Int, strokeColor: Int, strokeWidthDp: Int): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = 100f
            setColor(bgColor)
            if (strokeWidthDp > 0) {
                setStroke(strokeWidthDp, strokeColor)
            }
        }
    }

    private fun createCardDrawable(bgColor: Int, strokeColor: Int, radiusPx: Float): GradientDrawable {
        return GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = radiusPx
            setColor(bgColor)
            setStroke(2, strokeColor)
        }
    }
}

/**
 * Visualizador animado de Respiração para o Modo Treino Flutuante.
 * Suporta o modo "Em Caixa" (Box Breathing com traço contínuo no perímetro)
 * e o modo com pulso/esfera expansiva para as demais respirações.
 */
class BreathVisualView(context: Context) : View(context) {

    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 6f
        color = Color.parseColor("#1E293B")
        strokeCap = Paint.Cap.ROUND
    }
    private val activePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 8f
        strokeCap = Paint.Cap.ROUND
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        textAlign = Paint.Align.CENTER
        typeface = Typeface.DEFAULT_BOLD
    }
    private val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#334155")
    }

    var isBoxPattern: Boolean = true
    var stepTimeLeft: Int = 0
    var phaseDuration: Int = 4
    var phaseLabel: String = "INSPIRE"
    var phaseIndex: Int = 0
    var accentColor: Int = Color.parseColor("#10B981")

    fun updateState(isBox: Boolean, label: String, timeLeft: Int, duration: Int, color: Int, stepIndex: Int) {
        isBoxPattern = isBox
        phaseLabel = label
        stepTimeLeft = timeLeft
        phaseDuration = duration.coerceAtLeast(1)
        accentColor = color
        phaseIndex = (stepIndex % 4).coerceIn(0, 3)
        activePaint.color = color
        postInvalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f) return

        val pad = dpToPx(12).toFloat()
        val elapsed = (phaseDuration - stepTimeLeft).coerceAtLeast(0)
        val fraction = (elapsed.toFloat() / phaseDuration.toFloat()).coerceIn(0f, 1f)
        val cx = w / 2f
        val cy = h / 2f

        if (isBoxPattern) {
            val left = pad + 4f
            val top = pad + 4f
            val right = w - pad - 4f
            val bottom = h - pad - 4f
            val sideW = right - left
            val sideH = bottom - top

            // 1. Base track (rounded box)
            val rect = RectF(left, top, right, bottom)
            canvas.drawRoundRect(rect, 16f, 16f, trackPaint)

            // 2. Active sides drawing
            val path = Path()
            when (phaseIndex) {
                0 -> {
                    path.moveTo(left, top)
                    path.lineTo(left + sideW * fraction, top)
                }
                1 -> {
                    path.moveTo(left, top)
                    path.lineTo(right, top)
                    path.lineTo(right, top + sideH * fraction)
                }
                2 -> {
                    path.moveTo(left, top)
                    path.lineTo(right, top)
                    path.lineTo(right, bottom)
                    path.lineTo(right - sideW * fraction, bottom)
                }
                3 -> {
                    path.moveTo(left, top)
                    path.lineTo(right, top)
                    path.lineTo(right, bottom)
                    path.lineTo(left, bottom)
                    path.lineTo(left, bottom - sideH * fraction)
                }
            }
            canvas.drawPath(path, activePaint)

            // Indicadores discretos dos cantos do quadrado
            canvas.drawCircle(left, top, 4f, dotPaint)
            canvas.drawCircle(right, top, 4f, dotPaint)
            canvas.drawCircle(right, bottom, 4f, dotPaint)
            canvas.drawCircle(left, bottom, 4f, dotPaint)
        } else {
            // Pulsação circular suave para outras respirações
            val baseR = (w / 2f) - pad - 8f
            val scale = when {
                phaseLabel.contains("INSPIRE", ignoreCase = true) -> 0.70f + (0.35f * fraction)
                phaseLabel.contains("EXPIRE", ignoreCase = true) -> 1.05f - (0.35f * fraction)
                else -> 1.05f
            }
            val currentR = baseR * scale
            trackPaint.style = Paint.Style.STROKE
            canvas.drawCircle(cx, cy, baseR, trackPaint)

            fillPaint.color = ColorUtils.setAlphaComponent(accentColor, 40)
            canvas.drawCircle(cx, cy, currentR, fillPaint)
            activePaint.style = Paint.Style.STROKE
            canvas.drawCircle(cx, cy, currentR, activePaint)
        }

        // Texto Central: Fase e Segundos restantes
        textPaint.color = accentColor
        textPaint.textSize = spToPx(12).toFloat()
        textPaint.typeface = Typeface.DEFAULT_BOLD
        canvas.drawText(phaseLabel.uppercase(), cx, cy - dpToPx(4).toFloat(), textPaint)

        textPaint.color = Color.WHITE
        textPaint.textSize = spToPx(26).toFloat()
        textPaint.typeface = Typeface.MONOSPACE
        val secStr = "%02d".format(stepTimeLeft)
        canvas.drawText(secStr, cx, cy + dpToPx(20).toFloat(), textPaint)
    }

    private fun dpToPx(dp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            context.resources.displayMetrics
        ).toInt()
    }

    private fun spToPx(sp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_SP,
            sp.toFloat(),
            context.resources.displayMetrics
        ).toInt()
    }
}

package com.example

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.speech.tts.TextToSpeech
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

/**
 * Mantém o treino guiado ativo fora da tela do aplicativo.
 *
 * O serviço é a única fonte do cronômetro durante uma sessão nativa. A página
 * recebe snapshots para renderizar o estado, mas fala, vibração e transições
 * continuam funcionando mesmo quando o WebView é suspenso pelo Android.
 */
class WorkoutForegroundService : Service() {

    private data class Step(
        val title: String,
        val instruction: String,
        val duration: Int,
        val isRest: Boolean,
        val voice: String,
        val badge: String,
        val phase: String,
        val haptic: String,
        val series: Int
    )

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var tickerJob: Job? = null
    private var tts: TextToSpeech? = null
    private var ttsReady = false
    private var pendingSpeech: String? = null
    private var wakeLock: PowerManager.WakeLock? = null

    private var steps: List<Step> = emptyList()
    private var currentStepIndex = 0
    private var stepTimeLeft = 0
    private var totalSessionElapsed = 0
    private var paused = false
    private var sessionMetadata = JSONObject()
    private var voiceEnabled = true
    private var hapticsEnabled = true

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                configureTtsLanguage()
                ttsReady = true
                pendingSpeech?.let { text ->
                    pendingSpeech = null
                    speak(text)
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startSession(intent.getStringExtra(EXTRA_SESSION_JSON).orEmpty())
            ACTION_PAUSE -> pauseSession()
            ACTION_RESUME -> resumeSession()
            ACTION_SKIP -> advanceStep()
            ACTION_STOP -> stopSession(canceled = true)
            ACTION_REQUEST_STATE -> broadcastState()
            null -> restoreSession()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        tickerJob?.cancel()
        releaseWakeLock()
        tts?.stop()
        tts?.shutdown()
        scope.cancel()
        super.onDestroy()
    }

    private fun startSession(rawJson: String) {
        val payload = runCatching { JSONObject(rawJson) }.getOrNull()
        val parsedSteps = payload?.optJSONArray("steps")?.toSteps().orEmpty()
        if (payload == null || parsedSteps.isEmpty()) {
            stopSelf()
            return
        }

        steps = parsedSteps
        currentStepIndex = payload.optInt("currentStepIndex", 0).coerceIn(0, steps.lastIndex)
        stepTimeLeft = payload.optInt("stepTimeLeft", steps[currentStepIndex].duration)
            .coerceAtLeast(0)
        totalSessionElapsed = payload.optInt("totalSessionElapsed", 0).coerceAtLeast(0)
        voiceEnabled = payload.optBoolean("voiceEnabled", true)
        hapticsEnabled = payload.optBoolean("hapticsEnabled", true)
        paused = false
        sessionMetadata = JSONObject().apply {
            listOf(
                "programId",
                "phaseIndex",
                "programTitle",
                "phaseTitle",
                "sessionNumber",
                "targetSessions",
                "type",
                "completionMessage",
                "seriesTotal"
            ).forEach { key ->
                if (payload.has(key)) put(key, payload.get(key))
            }
        }

        startForeground(NOTIFICATION_ID, buildNotification())
        acquireWakeLock()
        announceCurrentStep(firstStep = true)
        persistAndBroadcast("running")
        startTicker()
    }

    private fun restoreSession() {
        val rawState = preferences().getString(PREF_STATE_JSON, null) ?: run {
            stopSelf()
            return
        }
        val state = runCatching { JSONObject(rawState) }.getOrNull() ?: run {
            stopSelf()
            return
        }
        val status = state.optString("status")
        if (status != "running" && status != "paused") {
            stopSelf()
            return
        }

        steps = state.optJSONArray("steps")?.toSteps().orEmpty()
        if (steps.isEmpty()) {
            stopSelf()
            return
        }
        currentStepIndex = state.optInt("currentStepIndex", 0).coerceIn(0, steps.lastIndex)
        stepTimeLeft = state.optInt("stepTimeLeft", steps[currentStepIndex].duration)
        totalSessionElapsed = state.optInt("totalSessionElapsed", 0)
        voiceEnabled = state.optBoolean("voiceEnabled", true)
        hapticsEnabled = state.optBoolean("hapticsEnabled", true)
        paused = status == "paused"
        sessionMetadata = state.optJSONObject("session") ?: JSONObject()

        startForeground(NOTIFICATION_ID, buildNotification())
        if (!paused) {
            acquireWakeLock()
            startTicker()
        }
        broadcastState()
    }

    private fun startTicker() {
        tickerJob?.cancel()
        tickerJob = scope.launch {
            while (isActive && steps.isNotEmpty()) {
                delay(1_000L)
                if (paused) continue

                totalSessionElapsed++
                if (stepTimeLeft > 1) {
                    stepTimeLeft--
                    persistAndBroadcast("running")
                } else {
                    stepTimeLeft = 0
                    advanceStep()
                }
            }
        }
    }

    private fun pauseSession() {
        if (steps.isEmpty()) return
        paused = true
        releaseWakeLock()
        persistAndBroadcast("paused")
    }

    private fun resumeSession() {
        if (steps.isEmpty()) return
        paused = false
        acquireWakeLock()
        persistAndBroadcast("running")
        startTicker()
    }

    private fun advanceStep() {
        if (steps.isEmpty()) return
        if (currentStepIndex < steps.lastIndex) {
            currentStepIndex++
            stepTimeLeft = steps[currentStepIndex].duration
            announceCurrentStep(firstStep = false)
            persistAndBroadcast(if (paused) "paused" else "running")
        } else {
            completeSession()
        }
    }

    private fun completeSession() {
        tickerJob?.cancel()
        releaseWakeLock()
        if (hapticsEnabled) AdvancedHapticsManager.playSuccessPattern(this)
        if (voiceEnabled) {
            speak(
                sessionMetadata.optString(
                    "completionMessage",
                    "Parabéns! Sessão de treino concluída com sucesso!"
                )
            )
        }
        persistAndBroadcast("completed")
        stopForeground(STOP_FOREGROUND_REMOVE)
        scope.launch {
            // Dá tempo para o mecanismo de voz terminar a mensagem final antes
            // de liberar o serviço e o TextToSpeech.
            delay(6_000L)
            stopSelf()
        }
    }

    private fun stopSession(canceled: Boolean) {
        tickerJob?.cancel()
        releaseWakeLock()
        persistAndBroadcast(if (canceled) "canceled" else "idle")
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun announceCurrentStep(firstStep: Boolean) {
        val step = steps.getOrNull(currentStepIndex) ?: return
        if (voiceEnabled) {
            val phrase = step.voice.ifBlank {
                when {
                    step.isRest && firstStep -> "Fase de relaxamento"
                    step.isRest -> "Relaxe agora"
                    firstStep -> "Iniciando ${step.title}"
                    else -> "Contração"
                }
            }
            speak(phrase)
        }
        if (hapticsEnabled) {
            when (step.haptic) {
                "inhale" -> AdvancedHapticsManager.playInhaleSignal(this)
                "exhale" -> AdvancedHapticsManager.playExhaleSignal(this)
                "success" -> AdvancedHapticsManager.playSuccessPattern(this)
                "relax" -> AdvancedHapticsManager.playRelaxationSignal(this)
                else -> if (step.isRest) {
                    AdvancedHapticsManager.playRelaxationSignal(this)
                } else {
                    AdvancedHapticsManager.playHeavyPulse(this)
                }
            }
        }
    }

    private fun speak(text: String) {
        if (!ttsReady) {
            pendingSpeech = text
            return
        }
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "CoreFlowBackgroundWorkout")
    }

    private fun configureTtsLanguage() {
        val ptBr = Locale("pt", "BR")
        val result = tts?.setLanguage(ptBr)
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            tts?.setLanguage(Locale("pt"))
        }
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "$packageName:WorkoutSession"
        ).apply {
            setReferenceCounted(false)
            acquire(MAX_WAKE_LOCK_DURATION_MS)
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.takeIf { it.isHeld }?.release()
        wakeLock = null
    }

    private fun persistAndBroadcast(status: String) {
        val state = stateJson(status)
        preferences().edit().putString(PREF_STATE_JSON, state.toString()).apply()
        broadcastState(state)
        if (status == "running" || status == "paused") {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(NOTIFICATION_ID, buildNotification())
        }
    }

    private fun broadcastState(state: JSONObject? = null) {
        val snapshot = state ?: currentStoredState() ?: stateJson(
            if (paused) "paused" else if (steps.isEmpty()) "idle" else "running"
        )
        sendBroadcast(
            Intent(ACTION_STATE_CHANGED)
                .setPackage(packageName)
                .putExtra(EXTRA_STATE_JSON, snapshot.toString())
        )
    }

    private fun stateJson(status: String): JSONObject = JSONObject().apply {
        put("status", status)
        put("currentStepIndex", currentStepIndex)
        put("stepTimeLeft", stepTimeLeft)
        put("totalSessionElapsed", totalSessionElapsed)
        put("voiceEnabled", voiceEnabled)
        put("hapticsEnabled", hapticsEnabled)
        put("session", sessionMetadata)
        put("steps", JSONArray().apply {
            steps.forEach { step ->
                put(JSONObject().apply {
                    put("title", step.title)
                    put("instruction", step.instruction)
                    put("duration", step.duration)
                    put("isRest", step.isRest)
                    put("voice", step.voice)
                    put("badge", step.badge)
                    put("phase", step.phase)
                    put("haptic", step.haptic)
                    put("series", step.series)
                })
            }
        })
    }

    private fun buildNotification(): android.app.Notification {
        val currentStep = steps.getOrNull(currentStepIndex)
        val title = if (paused) "Treino pausado" else currentStep?.title ?: "Treino em andamento"
        val detail = if (paused) {
            "Toque em continuar quando estiver pronto"
        } else {
            "${formatTime(stepTimeLeft)} • passo ${currentStepIndex + 1}/${steps.size.coerceAtLeast(1)}"
        }

        val openIntent = PendingIntent.getActivity(
            this,
            100,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val toggleAction = if (paused) ACTION_RESUME else ACTION_PAUSE
        val toggleLabel = if (paused) "Continuar" else "Pausar"
        val toggleIcon = if (paused) android.R.drawable.ic_media_play else android.R.drawable.ic_media_pause

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(title)
            .setContentText(detail)
            .setContentIntent(openIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory("workout")
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(toggleIcon, toggleLabel, servicePendingIntent(toggleAction, 101))
            .addAction(android.R.drawable.ic_media_next, "Pular", servicePendingIntent(ACTION_SKIP, 102))
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Parar", servicePendingIntent(ACTION_STOP, 103))
            .build()
    }

    private fun servicePendingIntent(action: String, requestCode: Int): PendingIntent =
        PendingIntent.getService(
            this,
            requestCode,
            Intent(this, WorkoutForegroundService::class.java).setAction(action),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Treino em andamento",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantém cronômetro, voz e vibração durante o treino em segundo plano"
                setSound(null, null)
                enableVibration(false)
            }
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(channel)
        }
    }

    private fun preferences() = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun currentStoredState(): JSONObject? = preferences()
        .getString(PREF_STATE_JSON, null)
        ?.let { runCatching { JSONObject(it) }.getOrNull() }

    private fun JSONArray.toSteps(): List<Step> = buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                Step(
                    title = item.optString("title", "Treino"),
                    instruction = item.optString("instruction", ""),
                    duration = item.optInt("duration", 1).coerceAtLeast(1),
                    isRest = item.optBoolean("isRest", false),
                    voice = item.optString("voice", ""),
                    badge = item.optString("badge", ""),
                    phase = item.optString("phase", ""),
                    haptic = item.optString("haptic", ""),
                    series = item.optInt("series", 0)
                )
            )
        }
    }

    private fun formatTime(seconds: Int): String = "%02d:%02d".format(seconds / 60, seconds % 60)

    companion object {
        const val ACTION_START = "com.example.workout.START"
        const val ACTION_PAUSE = "com.example.workout.PAUSE"
        const val ACTION_RESUME = "com.example.workout.RESUME"
        const val ACTION_SKIP = "com.example.workout.SKIP"
        const val ACTION_STOP = "com.example.workout.STOP"
        const val ACTION_REQUEST_STATE = "com.example.workout.REQUEST_STATE"
        const val ACTION_STATE_CHANGED = "com.example.workout.STATE_CHANGED"
        const val EXTRA_SESSION_JSON = "session_json"
        const val EXTRA_STATE_JSON = "state_json"

        private const val CHANNEL_ID = "coreflow_active_workout"
        private const val NOTIFICATION_ID = 2001
        private const val PREFS_NAME = "coreflow_workout_service"
        private const val PREF_STATE_JSON = "workout_state_json"
        private const val MAX_WAKE_LOCK_DURATION_MS = 2 * 60 * 60 * 1_000L

        fun readStoredState(context: Context): String = context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(PREF_STATE_JSON, "{\"status\":\"idle\"}")
            ?: "{\"status\":\"idle\"}"

        fun clearStoredState(context: Context) {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(PREF_STATE_JSON, "{\"status\":\"idle\"}")
                .apply()
        }
    }
}

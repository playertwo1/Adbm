package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.content.BroadcastReceiver
import android.os.Build
import android.os.Bundle
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import com.airbnb.lottie.compose.LottieAnimation
import com.airbnb.lottie.compose.LottieCompositionSpec
import com.airbnb.lottie.compose.animateLottieCompositionAsState
import com.airbnb.lottie.compose.rememberLottieComposition

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.Manifest
import android.view.WindowManager
import androidx.activity.compose.BackHandler
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.print.PrintAttributes
import android.print.PrintManager
import android.speech.tts.TextToSpeech
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme
import java.util.Locale
import org.json.JSONObject

class MainActivity : ComponentActivity() {

    private var tts: TextToSpeech? = null
    private var webView: WebView? = null
    private var pendingReminderProgramId: String? = null
    private var pendingReminderSession: Int = 1
    private var pendingCustomSnooze: Boolean = false
    private var workoutReceiverRegistered = false
    private val workoutStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != WorkoutForegroundService.ACTION_STATE_CHANGED) return
            intent.getStringExtra(WorkoutForegroundService.EXTRA_STATE_JSON)?.let(::deliverWorkoutState)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        captureReminderIntent(intent)

        val workoutFilter = IntentFilter(WorkoutForegroundService.ACTION_STATE_CHANGED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(workoutStateReceiver, workoutFilter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(workoutStateReceiver, workoutFilter)
        }
        workoutReceiverRegistered = true

        createNotificationChannel()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }

        // Initialize Android TextToSpeech with Portuguese with robust fallback
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val ptBr = Locale("pt", "BR")
                val res = tts?.setLanguage(ptBr)
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    val pt = Locale("pt")
                    val resPt = tts?.setLanguage(pt)
                    if (resPt == TextToSpeech.LANG_MISSING_DATA || resPt == TextToSpeech.LANG_NOT_SUPPORTED) {
                        tts?.setLanguage(Locale.getDefault())
                    }
                }
            }
        }

        setContent {
            val showConfetti = remember { mutableStateOf(false) }

            // Native Android Back Button Navigation
            BackHandler(enabled = true) {
                webView?.evaluateJavascript(
                    "if (typeof window.handleAndroidBack === 'function') { window.handleAndroidBack(); } else { false; }"
                ) { result ->
                    val handled = result?.trim()?.replace("\"", "") == "true"
                    if (!handled) {
                        if (webView?.canGoBack() == true) {
                            webView?.goBack()
                        } else {
                            finish()
                        }
                    }
                }
            }

            MyApplicationTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF0F172A)),
                    color = Color(0xFF0F172A)
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        CoreFlowWebView(
                            onWebViewCreated = { wv ->
                                webView = wv
                            },
                            onPageReady = {
                                deliverPendingReminder()
                            },
                            tts = tts,
                            onPlayConfetti = {
                                showConfetti.value = true
                            }
                        )
                        if (showConfetti.value) {
                            ConfettiAnimationOverlay(
                                onFinished = { showConfetti.value = false }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Lembretes CoreFlow"
            val descriptionText = "Lembretes diários de treinos e programas"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel("coreflow_reminders", name, importance).apply {
                description = descriptionText
                enableVibration(true)
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        if (workoutReceiverRegistered) {
            unregisterReceiver(workoutStateReceiver)
            workoutReceiverRegistered = false
        }
        tts?.stop()
        tts?.shutdown()
        webView?.destroy()
        super.onDestroy()
    }

    override fun onResume() {
        super.onResume()
        deliverWorkoutState(WorkoutForegroundService.readStoredState(this))
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        captureReminderIntent(intent)
        deliverPendingReminder()
    }

    private fun captureReminderIntent(intent: Intent?) {
        val programId = intent?.getStringExtra(ReminderScheduler.EXTRA_PROGRAM_ID) ?: return
        pendingReminderProgramId = programId
        pendingReminderSession = intent.getIntExtra(ReminderScheduler.EXTRA_SESSION_NUMBER, 1)
        pendingCustomSnooze = intent.getBooleanExtra(ReminderScheduler.EXTRA_OPEN_CUSTOM_SNOOZE, false)
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .cancel(ReminderScheduler.notificationId(programId, pendingReminderSession))
    }

    private fun deliverPendingReminder() {
        val programId = pendingReminderProgramId ?: return
        val targetWebView = webView ?: return
        val script = "if (window.onNativeReminderOpened) window.onNativeReminderOpened(" +
            "${JSONObject.quote(programId)}, $pendingReminderSession, $pendingCustomSnooze);"
        targetWebView.evaluateJavascript(script, null)
        pendingReminderProgramId = null
        pendingCustomSnooze = false
    }

    private fun deliverWorkoutState(stateJson: String) {
        runOnUiThread {
            webView?.evaluateJavascript(
                "if (window.onNativeWorkoutState) window.onNativeWorkoutState(${JSONObject.quote(stateJson)});",
                null
            )
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun CoreFlowWebView(
    onWebViewCreated: (WebView) -> Unit,
    onPageReady: () -> Unit,
    tts: TextToSpeech?,
    onPlayConfetti: () -> Unit
) {
    val context = LocalContext.current

    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setBackgroundColor(android.graphics.Color.parseColor("#0F172A"))

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                    allowFileAccess = true
                    allowContentAccess = true
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }

                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        val state = WorkoutForegroundService.readStoredState(ctx)
                        view?.evaluateJavascript(
                            "if (window.onNativeWorkoutState) window.onNativeWorkoutState(${JSONObject.quote(state)});",
                            null
                        )
                        onPageReady()
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest?) {
                        request?.grant(request.resources)
                    }
                }

                // Inject Native JavaScript Bridge
                addJavascriptInterface(
                    AndroidBridge(ctx, this, tts, onPlayConfetti),
                    "AndroidBridge"
                )

                loadUrl("file:///android_asset/index.html")
                onWebViewCreated(this)
            }
        },
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()
    )
}

class AndroidBridge(
    private val context: Context,
    private val webView: WebView,
    private val tts: TextToSpeech?,
    private val onPlayConfetti: () -> Unit
) {

    @JavascriptInterface
    fun playConfetti() {
        val activity = context as? ComponentActivity ?: return
        activity.runOnUiThread {
            onPlayConfetti()
        }
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        val vibrator = getVibrator(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(durationMs)
        }
    }

    @JavascriptInterface
    fun vibratePattern(patternStr: String) {
        val timings = try {
            patternStr.split(",").map { it.trim().toLong() }.toLongArray()
        } catch (e: Exception) {
            longArrayOf(100)
        }

        val vibrator = getVibrator(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val waveform = if (timings.size % 2 == 1) {
                longArrayOf(0L) + timings
            } else {
                timings
            }
            vibrator.vibrate(VibrationEffect.createWaveform(waveform, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(timings, -1)
        }
    }

    @JavascriptInterface
    fun playLightTick() {
        AdvancedHapticsManager.playLightTick(context)
    }

    @JavascriptInterface
    fun playHeavyPulse() {
        AdvancedHapticsManager.playHeavyPulse(context)
    }

    @JavascriptInterface
    fun playRelaxationSignal() {
        AdvancedHapticsManager.playRelaxationSignal(context)
    }

    @JavascriptInterface
    fun playBreathingWave() {
        AdvancedHapticsManager.playBreathingWave(context)
    }

    @JavascriptInterface
    fun playInhaleSignal() {
        AdvancedHapticsManager.playInhaleSignal(context)
    }

    @JavascriptInterface
    fun playExhaleSignal() {
        AdvancedHapticsManager.playExhaleSignal(context)
    }

    @JavascriptInterface
    fun playSuccessPattern() {
        AdvancedHapticsManager.playSuccessPattern(context)
    }

    @JavascriptInterface
    fun startWorkoutSession(sessionJson: String): Boolean = runCatching {
        val intent = Intent(context, WorkoutForegroundService::class.java)
            .setAction(WorkoutForegroundService.ACTION_START)
            .putExtra(WorkoutForegroundService.EXTRA_SESSION_JSON, sessionJson)
        ContextCompat.startForegroundService(context, intent)
        true
    }.getOrDefault(false)

    @JavascriptInterface
    fun pauseWorkoutSession() {
        sendWorkoutAction(WorkoutForegroundService.ACTION_PAUSE)
    }

    @JavascriptInterface
    fun resumeWorkoutSession() {
        sendWorkoutAction(WorkoutForegroundService.ACTION_RESUME)
    }

    @JavascriptInterface
    fun skipWorkoutStep() {
        sendWorkoutAction(WorkoutForegroundService.ACTION_SKIP)
    }

    @JavascriptInterface
    fun stopWorkoutSession() {
        sendWorkoutAction(WorkoutForegroundService.ACTION_STOP)
    }

    @JavascriptInterface
    fun getWorkoutState(): String = WorkoutForegroundService.readStoredState(context)

    @JavascriptInterface
    fun acknowledgeWorkoutState() {
        WorkoutForegroundService.clearStoredState(context)
    }

    private fun sendWorkoutAction(action: String) {
        context.startService(
            Intent(context, WorkoutForegroundService::class.java).setAction(action)
        )
    }

    private fun getVibrator(context: Context): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator ?: (context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator)
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    @JavascriptInterface
    fun setKeepScreenOn(enable: Boolean) {
        val activity = context as? ComponentActivity ?: return
        activity.runOnUiThread {
            if (enable) {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            } else {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        }
    }

    @JavascriptInterface
    fun speakText(text: String) {
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "CoreFlowUtterance")
    }

    @JavascriptInterface
    fun printPdf() {
        val activity = context as? ComponentActivity ?: return
        activity.runOnUiThread {
            val printManager = context.getSystemService(Context.PRINT_SERVICE) as? PrintManager
            val printAdapter = webView.createPrintDocumentAdapter("CoreFlow_Relatorio_Desempenho")
            val jobName = "CoreFlow Relatório " + System.currentTimeMillis()
            printManager?.print(jobName, printAdapter, PrintAttributes.Builder().build())
        }
    }

    @JavascriptInterface
    fun postLocalNotification(title: String, message: String) {
        val activity = context as? ComponentActivity ?: return
        activity.runOnUiThread {
            try {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return@runOnUiThread
                val channelId = "coreflow_reminders"
                val intent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                val builder = NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(title)
                    .setContentText(message)
                    .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                    .setContentIntent(pendingIntent)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                notificationManager.notify((System.currentTimeMillis() % 100000).toInt(), builder.build())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @JavascriptInterface
    fun schedulePushNotification() {
        val activity = context as? ComponentActivity ?: return
        activity.runOnUiThread {
            requestNotificationPermission(activity)
            Toast.makeText(
                context,
                "Ative os horários de cada programa para receber os lembretes.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    @JavascriptInterface
    fun scheduleProgramReminders(
        programId: String,
        title: String,
        time1: String,
        time2: String,
        targetSessions: Int,
        enabled: Boolean,
        showConfirmation: Boolean
    ) {
        ReminderScheduler.updateProgram(context, programId, title, time1, time2, targetSessions, enabled)
        val activity = context as? ComponentActivity ?: return
        activity.runOnUiThread {
            if (enabled) requestNotificationPermission(activity)
            if (showConfirmation) {
                val message = if (enabled) {
                    if (targetSessions <= 1) "Lembrete ativo às $time1" else "Lembretes ativos às $time1 e $time2"
                } else {
                    "Lembretes desativados para este programa"
                }
                Toast.makeText(context, message, Toast.LENGTH_LONG).show()
            }
        }
    }

    @JavascriptInterface
    fun snoozeProgramReminder(
        programId: String,
        title: String,
        sessionNumber: Int,
        minutes: Int
    ) {
        ReminderScheduler.scheduleSnooze(context, programId, title, sessionNumber, minutes)
    }

    @JavascriptInterface
    fun postReminderNotification(programId: String, title: String, sessionNumber: Int, targetSessions: Int) {
        ReminderScheduler.showNotification(context, programId, title, sessionNumber, targetSessions)
    }

    @JavascriptInterface
    fun updateProgramReminderProgress(programId: String, sessionsToday: Int, dateKey: String) {
        ReminderScheduler.updateProgress(context, programId, sessionsToday, dateKey)
    }

    @JavascriptInterface
    fun hasNativeReminderScheduler(): Boolean = true

    @JavascriptInterface
    fun notificationsPermissionGranted(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    private fun requestNotificationPermission(activity: ComponentActivity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
        }
    }
}

object AdvancedHapticsManager {

    private fun getVibrator(context: Context): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator ?: (context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator)
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    /**
     * Pulso Leve e Rápido (Tick)
     * Ideal para: Kegel de Velocidade (Metrônomo) e toques em botões.
     */
    fun playLightTick(context: Context) {
        val vibrator = getVibrator(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(30L)
        }
    }

    /**
     * Pulso Pesado e Marcante (Heavy Click)
     * Ideal para: Início da contração (Bracing e Kegel de Resistência).
     */
    fun playHeavyPulse(context: Context) {
        val vibrator = getVibrator(context)
        val timings = longArrayOf(0, 220, 70, 220)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val amplitudes = intArrayOf(0, 255, 0, 255)
            if (vibrator.hasAmplitudeControl()) {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(timings, -1)
        }
    }

    /**
     * Vibração Dupla Suave (Double Click)
     * Ideal para: Sinalizar a fase de RELAXAMENTO.
     */
    fun playRelaxationSignal(context: Context) {
        val vibrator = getVibrator(context)
        val timings = longArrayOf(0, 150, 110, 150, 110, 150)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val amplitudes = intArrayOf(0, 220, 0, 220, 0, 220)
            if (vibrator.hasAmplitudeControl()) {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(timings, -1)
        }
    }

    /**
     * Onda de Expansão (Inspiração / Vácuo)
     * Cria uma vibração que começa fraca e vai aumentando a força.
     * Ideal para: Guiar a inspiração de 4s no Player de Vácuo sem olhar para a tela.
     */
    fun playBreathingWave(context: Context) {
        playInhaleSignal(context)
    }

    /** Inspiração: pulsos crescentes e fortes durante quatro segundos. */
    fun playInhaleSignal(context: Context) {
        val vibrator = getVibrator(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 500, 140, 600, 140, 700, 140, 780)
            val amplitudes = intArrayOf(0, 95, 0, 145, 0, 205, 0, 255)
            
            if (vibrator.hasAmplitudeControl()) {
                val effect = VibrationEffect.createWaveform(timings, amplitudes, -1)
                vibrator.vibrate(effect)
            } else {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(longArrayOf(0, 500, 140, 600, 140, 700, 140, 780), -1)
        }
    }

    /** Expiração: seis pulsos fortes que diminuem gradualmente. */
    fun playExhaleSignal(context: Context) {
        val vibrator = getVibrator(context)
        val timings = longArrayOf(0, 650, 160, 600, 160, 550, 160, 500, 160, 450, 160, 400)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val amplitudes = intArrayOf(0, 255, 0, 235, 0, 215, 0, 195, 0, 175, 0, 155)
            if (vibrator.hasAmplitudeControl()) {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(timings, -1)
        }
    }

    /**
     * Vibração de Sucesso (Completar Série / Bater Meta)
     */
    fun playSuccessPattern(context: Context) {
        val vibrator = getVibrator(context)
        val timings = longArrayOf(0, 100, 100, 100, 100, 300)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val amplitudes = intArrayOf(0, 100, 0, 150, 0, 255)
            if (vibrator.hasAmplitudeControl()) {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
            } else {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(timings, -1)
        }
    }
}

@Composable
fun ConfettiAnimationOverlay(onFinished: () -> Unit) {
    val composition by rememberLottieComposition(LottieCompositionSpec.Url("https://assets10.lottiefiles.com/packages/lf20_u4yrau.json"))
    val progress by animateLottieCompositionAsState(
        composition = composition,
        isPlaying = true,
        iterations = 1
    )

    LaunchedEffect(progress) {
        if (progress == 1f) {
            onFinished()
        }
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        LottieAnimation(
            composition = composition,
            progress = { progress },
            modifier = Modifier.fillMaxSize()
        )
    }
}

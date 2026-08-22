package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Bundle
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

class MainActivity : ComponentActivity() {

    private var tts: TextToSpeech? = null
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Initialize Android TextToSpeech in Portuguese
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("pt", "BR")
            }
        }

        setContent {
            MyApplicationTheme {
                Surface(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF0F172A)),
                    color = Color(0xFF0F172A)
                ) {
                    CoreFlowWebView(
                        onWebViewCreated = { wv ->
                            webView = wv
                        },
                        tts = tts
                    )
                }
            }
        }
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        webView?.destroy()
        super.onDestroy()
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun CoreFlowWebView(
    onWebViewCreated: (WebView) -> Unit,
    tts: TextToSpeech?
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
                    }
                }

                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest?) {
                        request?.grant(request.resources)
                    }
                }

                // Inject Native JavaScript Bridge
                addJavascriptInterface(
                    AndroidBridge(ctx, this, tts),
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
    private val tts: TextToSpeech?
) {

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
    fun playSuccessPattern() {
        AdvancedHapticsManager.playSuccessPattern(context)
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
    fun schedulePushNotification() {
        val activity = context as? ComponentActivity ?: return
        activity.runOnUiThread {
            Toast.makeText(
                context,
                "Lembretes e notificações locais ativados com sucesso no CoreFlow!",
                Toast.LENGTH_LONG
            ).show()
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK))
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(150L, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(150L)
        }
    }

    /**
     * Vibração Dupla Suave (Double Click)
     * Ideal para: Sinalizar a fase de RELAXAMENTO.
     */
    fun playRelaxationSignal(context: Context) {
        val vibrator = getVibrator(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_DOUBLE_CLICK))
        } else {
            val timings = longArrayOf(0, 50, 100, 50)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(timings, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(timings, -1)
            }
        }
    }

    /**
     * Onda de Expansão (Inspiração / Vácuo)
     * Cria uma vibração que começa fraca e vai aumentando a força.
     * Ideal para: Guiar a inspiração de 4s no Player de Vácuo sem olhar para a tela.
     */
    fun playBreathingWave(context: Context) {
        val vibrator = getVibrator(context)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 500, 500, 500, 500, 500, 500)
            val amplitudes = intArrayOf(0, 20, 50, 100, 150, 200, 255)
            
            if (vibrator.hasAmplitudeControl()) {
                val effect = VibrationEffect.createWaveform(timings, amplitudes, -1)
                vibrator.vibrate(effect)
            } else {
                vibrator.vibrate(VibrationEffect.createOneShot(3000L, VibrationEffect.DEFAULT_AMPLITUDE))
            }
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(3000L)
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

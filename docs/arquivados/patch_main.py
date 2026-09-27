import re

with open('app/src/main/java/com/example/MainActivity.kt', 'r') as f:
    content = f.read()

imports = """
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
"""

# Insert imports
content = re.sub(r'(import android.os.Bundle)', r'\1' + imports, content)

# Modify setContent block
setContent_orig = """        setContent {
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
        }"""

setContent_new = """        setContent {
            val showConfetti = remember { mutableStateOf(false) }

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
        }"""

content = content.replace(setContent_orig, setContent_new)

# Modify CoreFlowWebView signature
coreFlow_orig = """fun CoreFlowWebView(
    onWebViewCreated: (WebView) -> Unit,
    tts: TextToSpeech?
) {"""

coreFlow_new = """fun CoreFlowWebView(
    onWebViewCreated: (WebView) -> Unit,
    tts: TextToSpeech?,
    onPlayConfetti: () -> Unit
) {"""

content = content.replace(coreFlow_orig, coreFlow_new)

# Modify AndroidBridge instantiation
bridge_orig = """                addJavascriptInterface(
                    AndroidBridge(ctx, this, tts),
                    "AndroidBridge"
                )"""

bridge_new = """                addJavascriptInterface(
                    AndroidBridge(ctx, this, tts, onPlayConfetti),
                    "AndroidBridge"
                )"""

content = content.replace(bridge_orig, bridge_new)

# Modify AndroidBridge class signature
class_orig = """class AndroidBridge(
    private val context: Context,
    private val webView: WebView,
    private val tts: TextToSpeech?
) {"""

class_new = """class AndroidBridge(
    private val context: Context,
    private val webView: WebView,
    private val tts: TextToSpeech?,
    private val onPlayConfetti: () -> Unit
) {"""

content = content.replace(class_orig, class_new)

# Add playConfetti to AndroidBridge
play_confetti = """    @JavascriptInterface
    fun playConfetti() {
        val activity = context as? ComponentActivity ?: return
        activity.runOnUiThread {
            onPlayConfetti()
        }
    }
"""

content = content.replace('    @JavascriptInterface\n    fun vibrate(durationMs: Long)', play_confetti + '\n    @JavascriptInterface\n    fun vibrate(durationMs: Long)')


# Add ConfettiAnimationOverlay composable at the end
composable = """
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
"""
content += composable

with open('app/src/main/java/com/example/MainActivity.kt', 'w') as f:
    f.write(content)

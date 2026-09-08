package com.example.wear

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject

class HapticListenerService : WearableListenerService() {
    override fun onMessageReceived(event: MessageEvent) {
        if (event.path != MESSAGE_PATH) return
        runCatching {
            val message = JSONObject(event.data.toString(Charsets.UTF_8))
            val id = message.getString("id")
            val sentAt = message.getLong("sentAt")
            if (System.currentTimeMillis() - sentAt !in 0..MAX_AGE_MS || wasHandled(id)) return

            val values = message.getJSONArray("pattern")
            val pattern = LongArray(values.length()) { index ->
                values.getLong(index).coerceIn(0L, 5_000L)
            }
            if (pattern.isEmpty()) return
            remember(id)
            vibrate(pattern)
        }
    }

    private fun vibrate(pattern: LongArray) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getSystemService(VibratorManager::class.java).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(pattern, -1)
        }
    }

    private fun wasHandled(id: String): Boolean =
        getSharedPreferences(PREFS, MODE_PRIVATE).contains(id)

    private fun remember(id: String) {
        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
        val now = System.currentTimeMillis()
        val editor = prefs.edit().putLong(id, now)
        prefs.all.forEach { (key, value) ->
            if (value is Long && now - value > DEDUPE_RETENTION_MS) editor.remove(key)
        }
        editor.apply()
    }

    companion object {
        private const val MESSAGE_PATH = "/coreflow/haptic/v1"
        private const val MAX_AGE_MS = 5_000L
        private const val DEDUPE_RETENTION_MS = 60_000L
        private const val PREFS = "handled_haptics"
    }
}

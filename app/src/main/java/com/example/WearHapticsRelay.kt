package com.example

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.Wearable
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

object WearHapticsRelay {
    private const val TAG = "WearHapticsRelay"
    private const val PREFS = "coreflow_wear"
    private const val KEY_ENABLED = "haptics_enabled"
    private const val KEY_GENERATION = "haptic_generation"
    const val MESSAGE_PATH = "/coreflow/haptic/v1"

    fun isEnabled(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, true)

    fun setEnabled(context: Context, enabled: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ENABLED, enabled)
            .apply()
    }

    fun sendPattern(context: Context, rawPattern: LongArray) {
        if (!isEnabled(context)) return
        val pattern = normalize(rawPattern)
        val payload = JSONObject()
            .put("type", "pattern")
            .put("id", UUID.randomUUID().toString())
            .put("sentAt", System.currentTimeMillis())
            .put("generation", nextGeneration(context))
            .put("pattern", JSONArray(pattern.toList()))
            .toString()
            .toByteArray(Charsets.UTF_8)

        sendPayload(context, payload)
    }

    fun cancel(context: Context) {
        val payload = JSONObject()
            .put("type", "cancel")
            .put("sentAt", System.currentTimeMillis())
            .put("generation", nextGeneration(context))
            .toString()
            .toByteArray(Charsets.UTF_8)

        sendPayload(context, payload)
    }

    private fun nextGeneration(context: Context): Long {
        val preferences = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val generation = preferences.getLong(KEY_GENERATION, 0L) + 1L
        preferences.edit().putLong(KEY_GENERATION, generation).apply()
        return generation
    }

    private fun sendPayload(context: Context, payload: ByteArray) {

        val appContext = context.applicationContext
        Wearable.getNodeClient(appContext).connectedNodes
            .addOnSuccessListener { nodes ->
                nodes.forEach { node ->
                    Wearable.getMessageClient(appContext)
                        .sendMessage(node.id, MESSAGE_PATH, payload)
                        .addOnFailureListener { error -> Log.w(TAG, "Falha ao enviar vibração", error) }
                }
            }
            .addOnFailureListener { error -> Log.w(TAG, "Relógio indisponível", error) }
    }

    private fun normalize(raw: LongArray): LongArray {
        val safe = raw.take(20).map { it.coerceIn(0L, 5_000L) }.toLongArray()
        if (safe.isEmpty()) return longArrayOf(0L, 60L)
        return if (safe.size % 2 == 1) longArrayOf(0L) + safe else safe
    }
}

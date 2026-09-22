package com.example

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object ReminderScheduler {
    const val ACTION_FIRE = "com.example.coreflow.REMINDER_FIRE"
    const val ACTION_SNOOZE = "com.example.coreflow.REMINDER_SNOOZE"
    const val ACTION_MIND_REMINDER_FIRE = "com.example.coreflow.MIND_REMINDER_FIRE"
    const val EXTRA_PROGRAM_ID = "program_id"
    const val EXTRA_PROGRAM_TITLE = "program_title"
    const val EXTRA_SESSION_NUMBER = "session_number"
    const val EXTRA_SNOOZE_MINUTES = "snooze_minutes"
    const val EXTRA_IS_SNOOZE = "is_snooze"
    const val EXTRA_OPEN_CUSTOM_SNOOZE = "open_custom_snooze"

    private const val PREFS = "coreflow_native_reminders"
    private const val PROGRAM_IDS = "program_ids"
    private const val CHANNEL_ID = "coreflow_reminders"

    fun updateProgram(
        context: Context,
        programId: String,
        title: String,
        time1: String,
        time2: String,
        targetSessions: Int,
        enabled: Boolean
    ) {
        val safeTarget = targetSessions.coerceIn(1, 2)
        val effectiveEnabled = enabled && hasEffectiveNotificationPermission(context) &&
            isValidTime(time1) && (safeTarget <= 1 || isValidTime(time2))
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val ids = prefs.getStringSet(PROGRAM_IDS, emptySet()).orEmpty().toMutableSet()
        ids.add(programId)
        prefs.edit()
            .putStringSet(PROGRAM_IDS, ids)
            .putString(key(programId, "title"), title)
            .putString(key(programId, "time1"), time1)
            .putString(key(programId, "time2"), time2)
            .putInt(key(programId, "target_sessions"), safeTarget)
            .putBoolean(key(programId, "enabled"), effectiveEnabled)
            .apply()

        cancelProgram(context, programId)
        if (effectiveEnabled) {
            scheduleDaily(context, programId, title, 1, time1)
            if (safeTarget > 1) scheduleDaily(context, programId, title, 2, time2)
        }
    }

    fun rescheduleAll(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val permissionGranted = hasEffectiveNotificationPermission(context)
        prefs.getStringSet(PROGRAM_IDS, emptySet()).orEmpty().forEach { programId ->
            if (!prefs.getBoolean(key(programId, "enabled"), false)) return@forEach
            if (!permissionGranted) {
                cancelProgram(context, programId)
                prefs.edit().putBoolean(key(programId, "enabled"), false).apply()
                return@forEach
            }
            val title = prefs.getString(key(programId, "title"), "Programa CoreFlow") ?: "Programa CoreFlow"
            val time1 = prefs.getString(key(programId, "time1"), "") ?: ""
            val time2 = prefs.getString(key(programId, "time2"), "") ?: ""
            val targetSessions = prefs.getInt(key(programId, "target_sessions"), 2).coerceIn(1, 2)
            if (!isValidTime(time1) || (targetSessions > 1 && !isValidTime(time2))) {
                cancelProgram(context, programId)
                prefs.edit().putBoolean(key(programId, "enabled"), false).apply()
                return@forEach
            }
            scheduleDaily(context, programId, title, 1, time1)
            if (targetSessions > 1) scheduleDaily(context, programId, title, 2, time2)
        }
    }

    fun updateProgress(context: Context, programId: String, sessionsToday: Int, dateKey: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putInt(key(programId, "sessions"), sessionsToday.coerceAtLeast(0))
            .putString(key(programId, "sessions_date"), dateKey)
            .apply()
    }

    fun scheduleSnooze(
        context: Context,
        programId: String,
        title: String,
        sessionNumber: Int,
        minutes: Int
    ) {
        if (!hasEffectiveNotificationPermission(context)) return
        val safeMinutes = minutes.coerceIn(1, 720)
        val triggerAt = System.currentTimeMillis() + safeMinutes * 60_000L
        scheduleAlarm(context, programId, title, sessionNumber, triggerAt, true, safeMinutes)
    }

    fun handleFire(context: Context, intent: Intent) {
        val programId = intent.getStringExtra(EXTRA_PROGRAM_ID) ?: return
        val title = intent.getStringExtra(EXTRA_PROGRAM_TITLE) ?: "Programa CoreFlow"
        val sessionNumber = intent.getIntExtra(EXTRA_SESSION_NUMBER, 1).coerceIn(1, 2)
        val isSnooze = intent.getBooleanExtra(EXTRA_IS_SNOOZE, false)
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        if (!hasEffectiveNotificationPermission(context)) {
            cancelProgram(context, programId)
            prefs.edit().putBoolean(key(programId, "enabled"), false).apply()
            return
        }

        if (!prefs.getBoolean(key(programId, "enabled"), false)) return

        val progressDate = prefs.getString(key(programId, "sessions_date"), null)
        val sessions = if (progressDate == currentDateKey()) {
            prefs.getInt(key(programId, "sessions"), 0)
        } else {
            0
        }

        if (sessions < sessionNumber) {
            val targetSessions = prefs.getInt(key(programId, "target_sessions"), 2).coerceIn(1, 2)
            showNotification(context, programId, title, sessionNumber, targetSessions)
        }

        if (!isSnooze) {
            val time = prefs.getString(key(programId, "time$sessionNumber"), null)
            if (time != null) scheduleDaily(context, programId, title, sessionNumber, time)
        }
    }

    fun showNotification(
        context: Context,
        programId: String,
        title: String,
        sessionNumber: Int,
        targetSessions: Int = 2
    ) {
        if (!hasEffectiveNotificationPermission(context)) return

        createChannel(context)
        val notificationId = notificationId(programId, sessionNumber)
        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_PROGRAM_ID, programId)
            putExtra(EXTRA_SESSION_NUMBER, sessionNumber)
        }
        val openPendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val customIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_PROGRAM_ID, programId)
            putExtra(EXTRA_SESSION_NUMBER, sessionNumber)
            putExtra(EXTRA_OPEN_CUSTOM_SNOOZE, true)
        }
        val customPendingIntent = PendingIntent.getActivity(
            context,
            notificationId + 30_000,
            customIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val safeTarget = targetSessions.coerceIn(1, 2)
        val message = "Hora da sessão $sessionNumber/$safeTarget. Toque para abrir o treino."
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("CoreFlow: $title")
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setContentIntent(openPendingIntent)
            .addAction(0, "Adiar 5 min", snoozePendingIntent(context, programId, title, sessionNumber, 5))
            .addAction(0, "Adiar 15 min", snoozePendingIntent(context, programId, title, sessionNumber, 15))
            .addAction(0, "Definir tempo", customPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(notificationId, notification)
    }

    fun cancelProgram(context: Context, programId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        (1..2).forEach { session ->
            (0..720).forEach { snoozeMinutes ->
                val snooze = snoozeMinutes > 0
                val request = if (snooze) snoozeRequestCode(programId, session, snoozeMinutes) else dailyRequestCode(programId, session)
                val intent = Intent(context, ReminderReceiver::class.java).apply {
                    action = ACTION_FIRE
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    request,
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                if (pendingIntent != null) {
                    alarmManager.cancel(pendingIntent)
                    pendingIntent.cancel()
                }
            }
        }
    }

    private fun scheduleDaily(
        context: Context,
        programId: String,
        title: String,
        sessionNumber: Int,
        time: String
    ) {
        if (!isValidTime(time)) return
        val parts = time.split(":")
        val hour = parts[0].toInt()
        val minute = parts[1].toInt()
        val now = Calendar.getInstance()
        val trigger = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= now.timeInMillis) add(Calendar.DAY_OF_YEAR, 1)
        }
        scheduleAlarm(context, programId, title, sessionNumber, trigger.timeInMillis, false)
    }

    private fun scheduleAlarm(
        context: Context,
        programId: String,
        title: String,
        sessionNumber: Int,
        triggerAt: Long,
        isSnooze: Boolean,
        snoozeMinutes: Int = 0
    ) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_FIRE
            putExtra(EXTRA_PROGRAM_ID, programId)
            putExtra(EXTRA_PROGRAM_TITLE, title)
            putExtra(EXTRA_SESSION_NUMBER, sessionNumber)
            putExtra(EXTRA_IS_SNOOZE, isSnooze)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            if (isSnooze) snoozeRequestCode(programId, sessionNumber, snoozeMinutes) else dailyRequestCode(programId, sessionNumber),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
        }
    }

    private fun snoozePendingIntent(
        context: Context,
        programId: String,
        title: String,
        sessionNumber: Int,
        minutes: Int
    ): PendingIntent {
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_SNOOZE
            putExtra(EXTRA_PROGRAM_ID, programId)
            putExtra(EXTRA_PROGRAM_TITLE, title)
            putExtra(EXTRA_SESSION_NUMBER, sessionNumber)
            putExtra(EXTRA_SNOOZE_MINUTES, minutes)
        }
        return PendingIntent.getBroadcast(
            context,
            snoozeRequestCode(programId, sessionNumber, minutes),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun cancelMindSmartReminder(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_MIND_REMINDER_FIRE
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            MIND_REMINDER_ID,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Lembretes CoreFlow",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Lembretes diários de treinos e programas"
            enableVibration(true)
        }
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .createNotificationChannel(channel)
    }

    internal fun dailyRequestCode(programId: String, sessionNumber: Int): Int =
        requestCode(programId, sessionNumber, false)

    // Identidade injetiva: base do programa isolada em blocos de 10_000 (acima do teto
    // sessão*1_000 + minutos, no máximo 2*1_000 + 720 = 2_720), então nenhuma combinação
    // de programa real x sessão real x minuto (1..720) pode colidir com outra, nem com o
    // espaço de request codes diários/notificação (que ocupam a faixa 0..~3_000_000).
    internal fun snoozeRequestCode(programId: String, sessionNumber: Int, minutes: Int): Int {
        val safeMinutes = minutes.coerceIn(1, 720)
        return SNOOZE_REQUEST_BASE + programBase(programId) * 10_000 + sessionNumber * 1_000 + safeMinutes
    }

    internal fun shouldPublishMindReminder(enabled: Boolean, time: String, permissionGranted: Boolean): Boolean =
        enabled && permissionGranted && isValidTime(time)

    private fun programBase(programId: String): Int =
        (programId.hashCode() and 0x7fffffff) % 100_000

    private fun requestCode(programId: String, sessionNumber: Int, snooze: Boolean): Int {
        val base = programBase(programId)
        return base * 10 + sessionNumber + if (snooze) 1_000_000 else 0
    }

    private const val SNOOZE_REQUEST_BASE = 10_000_000

    private const val MIND_REMINDER_ID = 999_001

    fun scheduleMindSmartReminder(context: Context, timeStr: String, enabled: Boolean) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, ReminderReceiver::class.java).apply {
            action = ACTION_MIND_REMINDER_FIRE
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            MIND_REMINDER_ID,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.cancel(pendingIntent)
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val effectiveEnabled = enabled && hasEffectiveNotificationPermission(context) && isValidTime(timeStr)
        prefs.edit().putBoolean("mind_reminder_enabled", effectiveEnabled).putString("mind_reminder_time", timeStr).apply()

        if (!effectiveEnabled) return

        val parts = timeStr.split(":")
        val hour = parts[0].toInt()
        val minute = parts[1].toInt()
        val now = Calendar.getInstance()
        val trigger = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (timeInMillis <= now.timeInMillis) add(Calendar.DAY_OF_YEAR, 1)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarmManager.canScheduleExactAlarms()) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger.timeInMillis, pendingIntent)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger.timeInMillis, pendingIntent)
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, trigger.timeInMillis, pendingIntent)
        }
    }

    fun showMindSmartNotification(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val time = prefs.getString("mind_reminder_time", "") ?: ""
        val enabled = prefs.getBoolean("mind_reminder_enabled", false)
        if (!shouldPublishMindReminder(enabled, time, hasEffectiveNotificationPermission(context))) {
            cancelMindSmartReminder(context)
            return
        }
        createChannel(context)
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("action_quick_breath", true)
            putExtra("breath_pattern_key", "caixa")
            putExtra("breath_duration_sec", 120)
        }
        val openPendingIntent = PendingIntent.getActivity(
            context,
            MIND_REMINDER_ID + 10,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val wearableExtender = NotificationCompat.WearableExtender()
            .setHintShowBackgroundOnly(false)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Momento de Pausa Consciente 🧘")
            .setContentText("Pausa de 2 minutos para descompressão e renovação do foco.")
            .setStyle(NotificationCompat.BigTextStyle().bigText("Pico de fadiga da tarde identificado. Uma pausa de apenas 2 minutos de respiração consciente restaura o equilíbrio parassimpático e renova o foco."))
            .setContentIntent(openPendingIntent)
            .addAction(0, "Respirar 2 min agora", openPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVibrate(longArrayOf(0, 200, 100, 200))
            .extend(wearableExtender)
            .setAutoCancel(true)
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(MIND_REMINDER_ID, notification)

        // Agendar para o dia seguinte automaticamente
        val storedPrefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (storedPrefs.getBoolean("mind_reminder_enabled", false) && hasEffectiveNotificationPermission(context)) {
            val storedTime = storedPrefs.getString("mind_reminder_time", "") ?: ""
            if (isValidTime(storedTime)) scheduleMindSmartReminder(context, storedTime, true)
        }
    }

    fun hasEffectiveNotificationPermission(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return false
        val manager = NotificationManagerCompat.from(context)
        if (!manager.areNotificationsEnabled()) return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .getNotificationChannel(CHANNEL_ID)
            if (channel?.importance == NotificationManager.IMPORTANCE_NONE) return false
        }
        return true
    }

    fun isValidTime(value: String): Boolean {
        if (!Regex("^\\d{2}:\\d{2}$").matches(value)) return false
        val parts = value.split(":")
        return parts[0].toInt() in 0..23 && parts[1].toInt() in 0..59
    }

    fun notificationId(programId: String, sessionNumber: Int): Int =
        requestCode(programId, sessionNumber, false) + 2_000_000

    private fun key(programId: String, suffix: String) = "program_${programId}_$suffix"

    private fun currentDateKey(): String =
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            ReminderScheduler.ACTION_FIRE -> ReminderScheduler.handleFire(context, intent)
            ReminderScheduler.ACTION_MIND_REMINDER_FIRE -> ReminderScheduler.showMindSmartNotification(context)
            ReminderScheduler.ACTION_SNOOZE -> {
                val programId = intent.getStringExtra(ReminderScheduler.EXTRA_PROGRAM_ID) ?: return
                val title = intent.getStringExtra(ReminderScheduler.EXTRA_PROGRAM_TITLE) ?: "Programa CoreFlow"
                val session = intent.getIntExtra(ReminderScheduler.EXTRA_SESSION_NUMBER, 1)
                val minutes = intent.getIntExtra(ReminderScheduler.EXTRA_SNOOZE_MINUTES, 5)
                ReminderScheduler.scheduleSnooze(context, programId, title, session, minutes)
                (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                    .cancel(ReminderScheduler.notificationId(programId, session))
            }
        }
    }
}

class ReminderRescheduleReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        ReminderScheduler.rescheduleAll(context)
        val prefs = context.getSharedPreferences("coreflow_native_reminders", Context.MODE_PRIVATE)
        val enabled = prefs.getBoolean("mind_reminder_enabled", false)
        val time = prefs.getString("mind_reminder_time", "") ?: ""
        // Nunca fabricar um horário ausente/inválido: reencaminha ao próprio agendador,
        // que já valida opt-in persistido, formato HH:mm e permissão efetiva antes de
        // publicar. Ausência/valor inválido apenas desativa e cancela o alarme nativo.
        ReminderScheduler.scheduleMindSmartReminder(context, time, enabled)
    }
}

package com.example

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

class MindfulnessAudioService : Service() {
    companion object {
        const val ACTION_START = "com.example.mindfulness.START"
        const val ACTION_STOP = "com.example.mindfulness.STOP"
        const val ACTION_UPDATE_STATE = "com.example.mindfulness.UPDATE_STATE"
        const val EXTRA_TITLE = "title"
        const val EXTRA_IS_PLAYING = "is_playing"
        const val EXTRA_POSITION_MS = "position_ms"
        const val EXTRA_DURATION_MS = "duration_ms"
        const val ACTION_MEDIA_CONTROL = "com.example.mindfulness.MEDIA_CONTROL"
        const val EXTRA_MEDIA_CONTROL_TYPE = "control_type"
        const val CONTROL_PLAY = "play"
        const val CONTROL_PAUSE = "pause"
        private const val CHANNEL_ID = "coreflow_mindfulness"
        private const val NOTIFICATION_ID = 4104
    }

    private var mediaSession: MediaSession? = null
    private var lastTitle: String = "Prática de Mindfulness"
    private var lastPositionMs: Long = 0L
    private var lastDurationMs: Long = 0L
    private var lastIsPlaying: Boolean = false

    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Meditação em andamento", NotificationManager.IMPORTANCE_LOW)
            )
        }
        mediaSession = MediaSession(this, "CoreFlowMindfulness").apply {
            setCallback(object : MediaSession.Callback() {
                override fun onPlay() { broadcastControl(CONTROL_PLAY) }
                override fun onPause() { broadcastControl(CONTROL_PAUSE) }
            })
            isActive = true
        }
    }

    private fun broadcastControl(type: String) {
        val intent = Intent(ACTION_MEDIA_CONTROL).setPackage(packageName).putExtra(EXTRA_MEDIA_CONTROL_TYPE, type)
        sendBroadcast(intent)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                mediaSession?.isActive = false
                mediaSession?.release()
                mediaSession = null
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_MEDIA_CONTROL -> {
                val type = intent.getStringExtra(EXTRA_MEDIA_CONTROL_TYPE)
                if (type != null) broadcastControl(type)
                return START_STICKY
            }
            ACTION_UPDATE_STATE -> {
                lastIsPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, lastIsPlaying)
                lastPositionMs = intent.getLongExtra(EXTRA_POSITION_MS, lastPositionMs)
                lastDurationMs = intent.getLongExtra(EXTRA_DURATION_MS, lastDurationMs)
                intent.getStringExtra(EXTRA_TITLE)?.let { lastTitle = it }
                updatePlaybackState()
                updateNotification()
                return START_STICKY
            }
        }
        lastTitle = intent?.getStringExtra(EXTRA_TITLE) ?: "Prática de Mindfulness"
        lastIsPlaying = true
        updatePlaybackState()
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildNotification(),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK else 0
        )
        return START_STICKY
    }

    private fun updatePlaybackState() {
        val state = if (lastIsPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED
        mediaSession?.setPlaybackState(
            PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or PlaybackState.ACTION_PLAY_PAUSE)
                .setState(state, lastPositionMs, if (lastIsPlaying) 1f else 0f)
                .build()
        )
    }

    private fun updateNotification() {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification())
    }

    private fun buildNotification(): android.app.Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 41, openIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val toggleAction = if (lastIsPlaying) {
            NotificationCompat.Action(
                android.R.drawable.ic_media_pause, "Pausar",
                mediaControlPendingIntent(CONTROL_PAUSE)
            )
        } else {
            NotificationCompat.Action(
                android.R.drawable.ic_media_play, "Reproduzir",
                mediaControlPendingIntent(CONTROL_PLAY)
            )
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("CoreFlow • Mindfulness")
            .setContentText(lastTitle)
            .setContentIntent(pendingIntent)
            .setOngoing(lastIsPlaying)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(toggleAction)
            .build()
    }

    private fun mediaControlPendingIntent(controlType: String): PendingIntent {
        val intent = Intent(this, MindfulnessAudioService::class.java).apply {
            action = ACTION_MEDIA_CONTROL
            putExtra(EXTRA_MEDIA_CONTROL_TYPE, controlType)
        }
        val requestCode = if (controlType == CONTROL_PLAY) 4105 else 4106
        return PendingIntent.getService(
            this, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    override fun onDestroy() {
        mediaSession?.isActive = false
        mediaSession?.release()
        mediaSession = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}

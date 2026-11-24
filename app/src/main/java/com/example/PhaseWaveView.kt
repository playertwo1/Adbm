package com.example

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.view.View
import kotlin.math.PI
import kotlin.math.sin

/**
 * Onda de fase do CoreFlow. Apenas apresentação: forma e cor vêm do estado do serviço
 * e o deslocamento horizontal nunca temporiza o treino.
 */
class PhaseWaveView(context: Context) : View(context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeWidth = 2.5f * resources.displayMetrics.density
    }
    private val path = Path()
    private var amplitude = 0.3f
    private var shift = 0f
    private var animator: ValueAnimator? = null
    private var movingRequested = false
    private var reducedMotion = false

    /** [amplitude] em fração da meia altura (0..1); [moving] false congela a onda (pausa). */
    fun setPhase(amplitude: Float, color: Int, moving: Boolean, reducedMotion: Boolean) {
        this.amplitude = amplitude.coerceIn(0f, 1f)
        this.reducedMotion = reducedMotion
        paint.color = color
        movingRequested = moving
        syncAnimator()
        invalidate()
    }

    private fun syncAnimator() {
        val canMove = movingRequested && !reducedMotion && isAttachedToWindow && ValueAnimator.areAnimatorsEnabled()
        if (!canMove) {
            animator?.cancel()
            animator = null
            return
        }
        if (animator != null) return
        animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 2400
            repeatCount = ValueAnimator.INFINITE
            interpolator = android.view.animation.LinearInterpolator()
            addUpdateListener { shift = it.animatedValue as Float; invalidate() }
            start()
        }
    }

    override fun onAttachedToWindow() { super.onAttachedToWindow(); syncAnimator() }
    override fun onDetachedFromWindow() { animator?.cancel(); animator = null; super.onDetachedFromWindow() }

    override fun onDraw(canvas: Canvas) {
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f) return
        val mid = h / 2f
        val amp = (h / 2f - paint.strokeWidth) * amplitude
        val period = w / 2f
        path.rewind()
        var x = 0f
        while (x <= w) {
            val y = mid - amp * sin(2.0 * PI * ((x / period) - shift)).toFloat()
            if (x == 0f) path.moveTo(x, y) else path.lineTo(x, y)
            x += 4f
        }
        canvas.drawPath(path, paint)
    }
}

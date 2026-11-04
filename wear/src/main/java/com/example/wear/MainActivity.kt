package com.example.wear

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(28), dp(28), dp(28), dp(28))
            setBackgroundColor(Color.rgb(11, 17, 15))
            addView(TextView(context).apply {
                text = "CoreFlow"
                textSize = 22f
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                letterSpacing = 0.02f
                setTextColor(Color.rgb(200, 230, 160))
                gravity = Gravity.CENTER
            })
            addView(TextView(context).apply {
                text = "Vibração do relógio pronta.\nInicie um exercício no celular."
                textSize = 14f
                setTextColor(Color.rgb(208, 216, 208))
                gravity = Gravity.CENTER
                setLineSpacing(dp(3).toFloat(), 1f)
                setPadding(0, dp(14), 0, 0)
            })
        })
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
}

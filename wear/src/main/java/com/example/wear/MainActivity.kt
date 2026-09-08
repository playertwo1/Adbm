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
            setPadding(28, 28, 28, 28)
            setBackgroundColor(Color.rgb(15, 23, 42))
            addView(TextView(context).apply {
                text = "CoreFlow"
                textSize = 22f
                setTextColor(Color.rgb(52, 211, 153))
                gravity = Gravity.CENTER
            })
            addView(TextView(context).apply {
                text = "Vibração do relógio pronta.\nInicie um exercício no celular."
                textSize = 14f
                setTextColor(Color.WHITE)
                gravity = Gravity.CENTER
                setPadding(0, 14, 0, 0)
            })
        })
    }
}

package com.surpriselink.app

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        val logoIcon = findViewById<ImageView>(R.id.splashLogo)
        val appName = findViewById<TextView>(R.id.splashAppName)
        val tagline = findViewById<TextView>(R.id.splashTagline)
        val shimmer = findViewById<View>(R.id.splashShimmer)

        // Initially hide elements
        logoIcon.alpha = 0f
        logoIcon.scaleX = 0.5f
        logoIcon.scaleY = 0.5f
        appName.alpha = 0f
        appName.translationY = 30f
        tagline.alpha = 0f
        tagline.translationY = 20f

        // Logo animation - scale up with bounce + fade in
        val logoScaleX = ObjectAnimator.ofFloat(logoIcon, "scaleX", 0.5f, 1f).apply {
            duration = 800
            interpolator = OvershootInterpolator(2f)
        }
        val logoScaleY = ObjectAnimator.ofFloat(logoIcon, "scaleY", 0.5f, 1f).apply {
            duration = 800
            interpolator = OvershootInterpolator(2f)
        }
        val logoAlpha = ObjectAnimator.ofFloat(logoIcon, "alpha", 0f, 1f).apply {
            duration = 600
        }

        val logoSet = AnimatorSet().apply {
            playTogether(logoScaleX, logoScaleY, logoAlpha)
            startDelay = 200
        }

        // App name animation
        val nameAlpha = ObjectAnimator.ofFloat(appName, "alpha", 0f, 1f).apply {
            duration = 500
        }
        val nameTranslate = ObjectAnimator.ofFloat(appName, "translationY", 30f, 0f).apply {
            duration = 500
            interpolator = AccelerateDecelerateInterpolator()
        }
        val nameSet = AnimatorSet().apply {
            playTogether(nameAlpha, nameTranslate)
            startDelay = 600
        }

        // Tagline animation
        val tagAlpha = ObjectAnimator.ofFloat(tagline, "alpha", 0f, 1f).apply {
            duration = 500
        }
        val tagTranslate = ObjectAnimator.ofFloat(tagline, "translationY", 20f, 0f).apply {
            duration = 500
            interpolator = AccelerateDecelerateInterpolator()
        }
        val tagSet = AnimatorSet().apply {
            playTogether(tagAlpha, tagTranslate)
            startDelay = 900
        }

        // Shimmer glow animation
        val shimmerAlpha = ObjectAnimator.ofFloat(shimmer, "alpha", 0f, 0.6f, 0f).apply {
            duration = 2000
            repeatCount = ObjectAnimator.INFINITE
            startDelay = 500
        }

        // Logo gentle floating animation
        val logoFloat = ObjectAnimator.ofFloat(logoIcon, "translationY", 0f, -12f, 0f).apply {
            duration = 3000
            repeatCount = ObjectAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            startDelay = 1000
        }

        AnimatorSet().apply {
            playTogether(logoSet, nameSet, tagSet, shimmerAlpha, logoFloat)
            start()
        }

        // Navigate to main activity after delay
        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
            finish()
        }, 2800)
    }
}

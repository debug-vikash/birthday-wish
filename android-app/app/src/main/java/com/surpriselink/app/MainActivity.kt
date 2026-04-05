package com.surpriselink.app

import android.Manifest
import android.animation.ObjectAnimator
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.webkit.*
import android.widget.Button
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.google.android.material.bottomnavigation.BottomNavigationView
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {

    companion object {
        private const val WEB_URL = "https://birthday-wish-gray-one.vercel.app/"
        private const val CREATE_URL = "${WEB_URL}create"
        private const val DASHBOARD_URL = "${WEB_URL}dashboard"
        private const val DOMAIN = "birthday-wish-gray-one.vercel.app"
    }

    private lateinit var webView: WebView
    private lateinit var loadingOverlay: View
    private lateinit var loadingDot1: View
    private lateinit var loadingDot2: View
    private lateinit var loadingDot3: View
    private lateinit var loadingText: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineScreen: View
    private lateinit var retryButton: Button
    private lateinit var backButton: ImageButton
    private lateinit var headerTitle: TextView
    private lateinit var bottomNav: BottomNavigationView

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoPath: String? = null
    private var isPageLoaded = false
    private var currentUrl: String = WEB_URL
    private var suppressNavSync = false

    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>
    private lateinit var permissionLauncher: ActivityResultLauncher<Array<String>>

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Make status bar transparent-ish
        window.statusBarColor = Color.parseColor("#FDF7FF")

        initViews()
        setupFileChooser()
        setupWebView()
        setupBottomNav()
        setupListeners()

        if (isNetworkAvailable()) {
            loadWeb(DASHBOARD_URL)
        } else {
            showOfflineScreen()
        }
    }

    private fun initViews() {
        webView = findViewById(R.id.webView)
        loadingOverlay = findViewById(R.id.loadingOverlay)
        loadingDot1 = findViewById(R.id.loadingDot1)
        loadingDot2 = findViewById(R.id.loadingDot2)
        loadingDot3 = findViewById(R.id.loadingDot3)
        loadingText = findViewById(R.id.loadingText)
        progressBar = findViewById(R.id.progressBar)
        offlineScreen = findViewById(R.id.offlineScreen)
        retryButton = findViewById(R.id.retryButton)
        backButton = findViewById(R.id.backButton)
        headerTitle = findViewById(R.id.headerTitle)
        bottomNav = findViewById(R.id.bottomNav)
    }

    private fun setupFileChooser() {
        fileChooserLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val data = result.data
                val results: Array<Uri>? = when {
                    data?.clipData != null -> {
                        Array(data.clipData!!.itemCount) { i ->
                            data.clipData!!.getItemAt(i).uri
                        }
                    }
                    data?.data != null -> arrayOf(data.data!!)
                    cameraPhotoPath != null -> {
                        val file = File(cameraPhotoPath!!)
                        if (file.exists()) arrayOf(Uri.fromFile(file)) else null
                    }
                    else -> null
                }
                fileUploadCallback?.onReceiveValue(results ?: arrayOf())
            } else {
                fileUploadCallback?.onReceiveValue(arrayOf())
            }
            fileUploadCallback = null
        }

        permissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            val allGranted = permissions.values.all { it }
            if (!allGranted) {
                Toast.makeText(this, "Permissions required for file upload", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // Set background matching surface to prevent white flash
        webView.setBackgroundColor(Color.parseColor("#FDF7FF"))

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            mediaPlaybackRequiresUserGesture = false
            javaScriptCanOpenWindowsAutomatically = true

            // Performance
            @Suppress("DEPRECATION")
            setRenderPriority(WebSettings.RenderPriority.HIGH)
        }

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.isScrollbarFadingEnabled = true
        webView.scrollBarStyle = View.SCROLLBARS_INSIDE_OVERLAY
        webView.overScrollMode = View.OVER_SCROLL_NEVER

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                url?.let { currentUrl = it }
                if (!isPageLoaded) {
                    showLoading()
                }
                progressBar.visibility = View.VISIBLE
                progressBar.progress = 0
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                url?.let { currentUrl = it }

                // Inject CSS/JS enhancements
                injectNativeCSS()
                if (url?.contains("/create") == true) {
                    injectCreatePageEnhancements()
                }

                // Smooth reveal
                if (!isPageLoaded) {
                    isPageLoaded = true
                    hideLoading()
                } else {
                    // For subsequent navigations, just make sure it's visible
                    webView.visibility = View.VISIBLE
                    loadingOverlay.visibility = View.GONE
                }

                progressBar.animate().alpha(0f).setDuration(300).withEndAction {
                    progressBar.visibility = View.INVISIBLE
                    progressBar.alpha = 1f
                }.start()

                updateHeader(url)
                syncBottomNav(url)
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showOfflineScreen()
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                return if (url.startsWith("http://") || url.startsWith("https://")) {
                    if (url.contains(DOMAIN)) {
                        false // Let WebView handle our app URLs
                    } else {
                        // Open external links in browser
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        true
                    }
                } else {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    } catch (e: Exception) { /* ignore */ }
                    true
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                checkAndRequestPermissions()
                openFileChooser(fileChooserParams)
                return true
            }
        }
    }

    // ==========================================
    // CSS INJECTION ENGINE
    // ==========================================

    private fun injectNativeCSS() {
        val css = """
            /* ===== NATIVE APP FEEL ===== */
            
            /* Hide web navigation since we have native header + bottom nav */
            nav { display: none !important; }
            
            /* Remove any top padding the web pages add for their own nav */
            body {
                padding-top: 0 !important;
                margin-top: 0 !important;
                padding-bottom: 70px !important;
                -webkit-tap-highlight-color: transparent;
                overscroll-behavior: none;
                -webkit-overflow-scrolling: touch;
            }
            
            main {
                padding-top: 8px !important;
            }
            
            /* Smooth scrolling */
            html { scroll-behavior: smooth; }
            
            /* Remove any fixed positioning that could conflict with native UI */
            .fixed-header, .mobile-nav { display: none !important; }
            
            /* Make all links/buttons feel tappable */
            a, button, [role="button"] {
                -webkit-tap-highlight-color: rgba(135, 78, 98, 0.1);
            }
            
            /* Prevent text selection for native feel */
            * { -webkit-user-select: none; user-select: none; }
            input, textarea, [contenteditable] {
                -webkit-user-select: auto;
                user-select: auto;
            }
            
            /* Hide scrollbar for cleaner look */
            ::-webkit-scrollbar { display: none; }
            body { -ms-overflow-style: none; scrollbar-width: none; }
            
            /* Micro-interaction: button press feedback */
            button, .craft-btn, .jelly-btn, [role="button"] {
                transition: transform 0.15s ease, box-shadow 0.15s ease !important;
            }
            button:active, .craft-btn:active, .jelly-btn:active {
                transform: scale(0.96) !important;
            }
            
            /* Premium input styling across all pages */
            input[type="text"], input[type="email"], input[type="password"],
            textarea, select {
                border-radius: 14px !important;
                border: 1.5px solid #e8d8ca !important;
                padding: 14px 16px !important;
                font-size: 15px !important;
                background: rgba(255,252,249,0.9) !important;
                transition: all 0.3s ease !important;
                -webkit-appearance: none !important;
                outline: none !important;
            }
            input:focus, textarea:focus, select:focus {
                border-color: #ff8fa3 !important;
                box-shadow: 0 0 0 4px rgba(255,143,163,0.12), 0 2px 8px rgba(255,143,163,0.08) !important;
                background: #fffcf9 !important;
            }
        """.trimIndent()

        injectCSS(css)
    }

    private fun injectCreatePageEnhancements() {
        val css = """
            /* ===== CREATE PAGE PREMIUM REDESIGN ===== */
            
            /* Page header refinement */
            main > div:first-child h1 {
                font-size: 1.75rem !important;
                letter-spacing: -0.03em !important;
                margin-bottom: 4px !important;
            }
            main > div:first-child p {
                font-size: 0.8rem !important;
                opacity: 0.7;
            }
            
            /* Form card elevation */
            .paper-card, form {
                border-radius: 24px !important;
                border: none !important;
                background: #fffcf9 !important;
                box-shadow: 0 2px 12px rgba(74,63,53,0.04), 0 12px 40px rgba(74,63,53,0.06) !important;
                padding: 24px !important;
            }
            
            /* Section labels - handcrafted feel */
            .section-label {
                font-size: 1rem !important;
                letter-spacing: -0.01em !important;
                margin-bottom: 10px !important;
                color: #4a3f35 !important;
            }
            
            /* Section dividers - softer */
            .hand-divider {
                height: 1px !important;
                background: linear-gradient(to right, transparent, #f0e4d7, transparent) !important;
                margin: 20px 0 !important;
            }
            
            /* Photo upload area - premium */
            .photo-pile {
                border-radius: 20px !important;
                border: 2px dashed #e0d0c0 !important;
                padding: 28px 20px !important;
                background: linear-gradient(135deg, #fffcf9, #f8f0e8) !important;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            }
            .photo-pile:active {
                transform: scale(0.98) !important;
                border-color: #ff8fa3 !important;
                background: linear-gradient(135deg, #fff8f5, #fef0ea) !important;
            }
            
            /* Photo grid - better spacing */
            #photo-gallery {
                gap: 8px !important;
                margin-top: 16px !important;
            }
            #photo-gallery > div {
                border-radius: 14px !important;
                overflow: hidden !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
                transition: transform 0.2s ease !important;
            }
            #photo-gallery img {
                border-radius: 14px !important;
            }
            
            /* Music card - warm sticky note */
            .sticky-note {
                border-radius: 20px !important;
                padding: 20px !important;
                background: linear-gradient(135deg, #fff8e8, #fff3d8) !important;
                border: none !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.03) !important;
            }
            
            /* Music upload input */
            .sticky-note .sketch-input {
                border-radius: 14px !important;
                background: rgba(255,255,255,0.8) !important;
            }
            
            /* Textarea (message) */
            textarea {
                min-height: 120px !important;
                line-height: 1.7 !important;
                border-radius: 16px !important;
            }
            
            /* Submit button - premium gradient pill */
            #submit-btn, .craft-btn[type="submit"] {
                border-radius: 50px !important;
                padding: 16px 32px !important;
                font-size: 15px !important;
                font-weight: 600 !important;
                border: none !important;
                background: linear-gradient(135deg, #ff6f91, #ff8fa3, #ff6f91) !important;
                background-size: 200% 100% !important;
                animation: gradientShift 3s ease infinite !important;
                box-shadow: 0 4px 15px rgba(255,111,145,0.3), 0 1px 3px rgba(255,111,145,0.2) !important;
                transition: all 0.3s ease !important;
                letter-spacing: 0.02em !important;
            }
            #submit-btn:active {
                transform: scale(0.97) !important;
                box-shadow: 0 2px 8px rgba(255,111,145,0.3) !important;
            }
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            /* Success popup - rounded */
            #success-popup > div {
                border-radius: 24px !important;
                border: none !important;
            }
            
            /* Loading overlay - softer */
            #loading {
                background: rgba(250,243,238,0.97) !important;
            }
            
            /* Helper text */
            .helper-text {
                font-size: 0.7rem !important;
                opacity: 0.6;
            }
            
            /* Trim controls */
            #music-trim-container {
                border-radius: 14px;
                padding: 12px;
                background: rgba(255,255,255,0.5);
            }
            
            /* Custom occasion field animation */
            #custom-occasion-container {
                transition: all 0.3s ease;
            }
            
            /* Animated upload icon */
            .photo-pile .material-symbols-outlined {
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            }
            .photo-pile:active .material-symbols-outlined {
                transform: scale(1.2) !important;
                color: #ff8fa3 !important;
            }
        """.trimIndent()

        injectCSS(css)

        // Inject JS for micro-interactions
        val js = """
            (function() {
                // Add smooth entrance animations to form sections
                const sections = document.querySelectorAll('form > div');
                sections.forEach((section, i) => {
                    section.style.opacity = '0';
                    section.style.transform = 'translateY(15px)';
                    section.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    setTimeout(() => {
                        section.style.opacity = '1';
                        section.style.transform = 'translateY(0)';
                    }, 100 + (i * 60));
                });
                
                // Add focus ring animation to inputs
                const inputs = document.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.addEventListener('focus', function() {
                        this.style.transform = 'scale(1.01)';
                    });
                    input.addEventListener('blur', function() {
                        this.style.transform = 'scale(1)';
                    });
                });
            })();
        """.trimIndent()

        webView.evaluateJavascript(js, null)
    }

    private fun injectCSS(css: String) {
        val encoded = android.util.Base64.encodeToString(css.toByteArray(), android.util.Base64.NO_WRAP)
        val js = """
            (function() {
                var style = document.createElement('style');
                style.type = 'text/css';
                style.innerHTML = atob('$encoded');
                document.head.appendChild(style);
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    // ==========================================
    // BOTTOM NAVIGATION
    // ==========================================

    private fun setupBottomNav() {
        bottomNav.setOnItemSelectedListener { item ->
            if (suppressNavSync) return@setOnItemSelectedListener true

            when (item.itemId) {
                R.id.nav_home -> {
                    if (!currentUrl.contains("/dashboard")) {
                        loadWeb(DASHBOARD_URL)
                    }
                    true
                }
                R.id.nav_create -> {
                    if (!currentUrl.contains("/create")) {
                        loadWeb(CREATE_URL)
                    }
                    true
                }
                R.id.nav_profile -> {
                    // Load dashboard for now (profile page can be added later)
                    if (!currentUrl.contains("/dashboard")) {
                        loadWeb(DASHBOARD_URL)
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun syncBottomNav(url: String?) {
        if (url == null) return
        suppressNavSync = true
        when {
            url.contains("/create") -> bottomNav.selectedItemId = R.id.nav_create
            url.contains("/dashboard") -> bottomNav.selectedItemId = R.id.nav_home
            url.contains("/view") -> {
                // Don't highlight any tab for view pages
            }
            else -> bottomNav.selectedItemId = R.id.nav_home
        }
        suppressNavSync = false
    }

    // ==========================================
    // PERMISSIONS & FILE UPLOAD
    // ==========================================

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf<String>()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_IMAGES)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_AUDIO)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA)
        }

        if (permissions.isNotEmpty()) {
            permissionLauncher.launch(permissions.toTypedArray())
        }
    }

    private fun openFileChooser(params: WebChromeClient.FileChooserParams?) {
        val acceptTypes = params?.acceptTypes ?: arrayOf("*/*")

        // Create camera intent
        val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        var photoFile: File? = null
        try {
            photoFile = createImageFile()
        } catch (ex: IOException) { /* Error */ }

        if (photoFile != null) {
            val photoURI = FileProvider.getUriForFile(
                this,
                "${applicationContext.packageName}.fileprovider",
                photoFile
            )
            takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI)
        }

        // Create file chooser intent
        val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
            if (acceptTypes.isNotEmpty() && acceptTypes[0] != "") {
                putExtra(Intent.EXTRA_MIME_TYPES, acceptTypes)
            }
        }

        val chooserIntent = Intent.createChooser(contentIntent, "Choose file")
        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(takePictureIntent))
        fileChooserLauncher.launch(chooserIntent)
    }

    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile("IMG_${timeStamp}_", ".jpg", storageDir).apply {
            cameraPhotoPath = absolutePath
        }
    }

    // ==========================================
    // UI STATE MANAGEMENT
    // ==========================================

    private fun setupListeners() {
        retryButton.setOnClickListener {
            it.animate()
                .scaleX(0.96f).scaleY(0.96f)
                .setDuration(100)
                .withEndAction {
                    it.animate().scaleX(1f).scaleY(1f).setDuration(100).start()
                }
                .start()

            if (isNetworkAvailable()) {
                offlineScreen.visibility = View.GONE
                isPageLoaded = false
                loadWeb(DASHBOARD_URL)
            } else {
                Toast.makeText(this, "Still offline. Please check your connection.", Toast.LENGTH_SHORT).show()
            }
        }

        backButton.setOnClickListener {
            if (webView.canGoBack()) {
                webView.goBack()
            }
        }
    }

    private fun loadWeb(url: String) {
        webView.loadUrl(url)
    }

    private fun showLoading() {
        loadingOverlay.visibility = View.VISIBLE
        loadingOverlay.alpha = 1f
        webView.visibility = View.INVISIBLE
        offlineScreen.visibility = View.GONE
        animateLoadingDots()
    }

    private fun hideLoading() {
        // Crossfade: show WebView underneath, then fade out overlay
        webView.visibility = View.VISIBLE

        loadingOverlay.animate()
            .alpha(0f)
            .setDuration(500)
            .withEndAction {
                loadingOverlay.visibility = View.GONE
                loadingOverlay.alpha = 1f
            }
            .start()
    }

    private fun animateLoadingDots() {
        val duration = 500L
        val delay = 150L

        fun animateDot(dot: View, startDelay: Long) {
            ObjectAnimator.ofFloat(dot, "alpha", 0.3f, 1f, 0.3f).apply {
                this.duration = duration
                this.startDelay = startDelay
                repeatCount = ObjectAnimator.INFINITE
                interpolator = AccelerateDecelerateInterpolator()
                start()
            }
            ObjectAnimator.ofFloat(dot, "scaleX", 0.8f, 1.2f, 0.8f).apply {
                this.duration = duration
                this.startDelay = startDelay
                repeatCount = ObjectAnimator.INFINITE
                interpolator = AccelerateDecelerateInterpolator()
                start()
            }
            ObjectAnimator.ofFloat(dot, "scaleY", 0.8f, 1.2f, 0.8f).apply {
                this.duration = duration
                this.startDelay = startDelay
                repeatCount = ObjectAnimator.INFINITE
                interpolator = AccelerateDecelerateInterpolator()
                start()
            }
        }

        animateDot(loadingDot1, 0)
        animateDot(loadingDot2, delay)
        animateDot(loadingDot3, delay * 2)
    }

    private fun showOfflineScreen() {
        offlineScreen.visibility = View.VISIBLE
        webView.visibility = View.INVISIBLE
        loadingOverlay.visibility = View.GONE

        val illustration = offlineScreen.findViewById<View>(R.id.offlineIllustration)
        illustration?.let {
            ObjectAnimator.ofFloat(it, "translationY", 0f, -8f, 0f).apply {
                duration = 3000
                repeatCount = ObjectAnimator.INFINITE
                interpolator = AccelerateDecelerateInterpolator()
                start()
            }
        }
    }

    private fun updateHeader(url: String?) {
        val title = when {
            url == null -> "Surprise Link"
            url.contains("/create") -> "Create Surprise"
            url.contains("/dashboard") -> "My Surprises"
            url.contains("/view") -> "Your Surprise"
            url.contains("/login") || url.contains("/register") -> "Welcome"
            else -> "Surprise Link"
        }
        headerTitle.text = title

        // Show back button if not on home/dashboard/login pages
        val showBack = webView.canGoBack() &&
            !url.orEmpty().let { it.endsWith("/") || it.contains("/dashboard") || it.contains("/login") || it.contains("/register") }
        backButton.visibility = if (showBack) View.VISIBLE else View.INVISIBLE

        // Hide bottom nav on view pages (full screen surprise experience)
        val hideNav = url?.contains("/view") == true
        bottomNav.visibility = if (hideNav) View.GONE else View.VISIBLE

        // Adjust WebView margin when nav is hidden
        val params = webView.layoutParams as? android.widget.FrameLayout.LayoutParams
        params?.bottomMargin = if (hideNav) 0 else resources.getDimensionPixelSize(R.dimen.bottom_nav_height)
        webView.layoutParams = params
    }

    // ==========================================
    // LIFECYCLE & NAVIGATION
    // ==========================================

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    @Deprecated("Use onBackPressedDispatcher instead")
    override fun onBackPressed() {
        when {
            webView.canGoBack() -> webView.goBack()
            else -> super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}

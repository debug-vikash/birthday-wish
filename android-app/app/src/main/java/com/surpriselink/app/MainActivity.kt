package com.surpriselink.app

import android.Manifest
import android.animation.ObjectAnimator
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
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
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {

    companion object {
        private const val WEB_URL = "https://birthday-wish-gray-one.vercel.app/"
        private const val CREATE_URL = "$WEB_URL/create"
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
    private lateinit var fabCreate: ExtendedFloatingActionButton

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoPath: String? = null

    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>
    private lateinit var permissionLauncher: ActivityResultLauncher<Array<String>>

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupFileChooser()
        setupWebView()
        setupListeners()

        if (isNetworkAvailable()) {
            loadWeb()
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
        fabCreate = findViewById(R.id.fabCreate)
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
            setRenderPriority(WebSettings.RenderPriority.HIGH)
            setEnableSmoothTransition(true)
        }

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.isScrollbarFadingEnabled = true
        webView.scrollBarStyle = View.SCROLLBARS_INSIDE_OVERLAY

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                showLoading()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                hideLoading()
                updateHeader(url)
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
                    if (url.contains("yourapp.vercel.app")) {
                        false // Let WebView handle our app URLs
                    } else {
                        // Open external links in browser
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        true
                    }
                } else {
                    // Handle tel:, mailto:, etc.
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    } catch (e: Exception) {
                        // ignore
                    }
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
        } catch (ex: IOException) {
            // Error occurred while creating the File
        }

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

    private fun setupListeners() {
        retryButton.setOnClickListener {
            // Button press animation
            it.animate()
                .scaleX(0.96f)
                .scaleY(0.96f)
                .setDuration(100)
                .withEndAction {
                    it.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(100)
                        .start()
                }
                .start()

            if (isNetworkAvailable()) {
                offlineScreen.visibility = View.GONE
                loadWeb()
            } else {
                Toast.makeText(this, "Still offline. Please check your connection.", Toast.LENGTH_SHORT).show()
            }
        }

        backButton.setOnClickListener {
            onBackPressedDispatcher.onBackPressed()
        }

        fabCreate.setOnClickListener {
            it.animate()
                .scaleX(0.96f)
                .scaleY(0.96f)
                .setDuration(100)
                .withEndAction {
                    it.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(100)
                        .start()
                    webView.loadUrl(CREATE_URL)
                }
                .start()
        }
    }

    private fun loadWeb() {
        webView.loadUrl(WEB_URL)
    }

    private fun showLoading() {
        loadingOverlay.visibility = View.VISIBLE
        webView.visibility = View.GONE
        offlineScreen.visibility = View.GONE

        // Animate the loading dots
        animateLoadingDots()
    }

    private fun hideLoading() {
        loadingOverlay.animate()
            .alpha(0f)
            .setDuration(400)
            .withEndAction {
                loadingOverlay.visibility = View.GONE
                loadingOverlay.alpha = 1f
                webView.visibility = View.VISIBLE
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
        webView.visibility = View.GONE
        loadingOverlay.visibility = View.GONE

        // Animate offline screen entrance
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
            url.contains("/dashboard") -> "Dashboard"
            url.contains("/view") -> "Your Surprise"
            else -> "Surprise Link"
        }
        headerTitle.text = title

        // Show back button if not on home page
        backButton.visibility = if (webView.canGoBack()) View.VISIBLE else View.INVISIBLE
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    @Deprecated("Use onBackPressedDispatcher instead")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
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

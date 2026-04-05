# 🎁 Surprise Link - Android App

A premium Android WebView app that wraps your Birthday Surprise web app with beautiful native UI components, designed using the **Velvet Keepsake** design system from Stitch.

## ✨ Features

| Feature | Description |
|---------|------------|
| 🎨 **Custom Splash Screen** | Soft peach-to-lavender gradient with animated gift icon, shimmer glow, floating hearts |
| 📱 **WebView Container** | Full-featured WebView with DOM storage, JS enabled, smooth scrolling |
| ⏳ **Loading Animation** | Glassmorphism card with pulsing pink dots and progress bar |
| 📡 **Offline Screen** | Cute cloud illustration, warm messaging, animated retry button |
| 📁 **File Upload** | Native file picker for images and audio, camera support |
| 🔙 **Smart Navigation** | In-page back navigation, header title updates, back button |
| 🎀 **FAB Button** | "Create Surprise" floating action button |
| 🎨 **Stitch Design System** | Velvet Keepsake theme with pastel pinks, lavender, and peach |

## 🏗️ Project Structure

```
android-app/
├── app/
│   ├── src/main/
│   │   ├── java/com/surpriselink/app/
│   │   │   ├── SplashActivity.kt       # Animated splash screen
│   │   │   └── MainActivity.kt         # WebView + all features
│   │   ├── res/
│   │   │   ├── layout/                  # XML layouts
│   │   │   ├── drawable/                # Icons, gradients, shapes
│   │   │   ├── font/                    # Plus Jakarta Sans
│   │   │   ├── values/                  # Colors, strings, themes
│   │   │   ├── mipmap-anydpi-v26/       # Adaptive icons
│   │   │   └── xml/                     # File provider paths
│   │   └── AndroidManifest.xml
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## 🚀 How to Build

### Prerequisites
1. **Android Studio** (Hedgehog or newer)
2. **JDK 17+**
3. **Android SDK 34**

### Steps

1. **Open in Android Studio**
   - File → Open → Select `android-app/` folder

2. **Download Font Files**
   - Download Plus Jakarta Sans from [Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
   - Place font files in `app/src/main/res/font/`:
     - `plusjakartasans_regular.ttf`
     - `plusjakartasans_semibold.ttf`
     - `plusjakartasans_bold.ttf`

3. **Update Web URL**
   - Open `MainActivity.kt`
   - Change `WEB_URL` to your actual Vercel deployment URL

4. **Sync Gradle**
   - Click "Sync Now" in Android Studio

5. **Build APK**
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK location: `app/build/outputs/apk/debug/app-debug.apk`

6. **Build Release AAB** (for Play Store)
   - Build → Generate Signed Bundle / APK
   - Follow the signing wizard

## 🎨 Design System

This app uses the **Velvet Keepsake** design system created in Stitch:

- **Primary**: `#874E62` (Deep Rose) / `#FDB5CC` (Soft Pink)
- **Secondary**: `#6D5586` (Twilight Lavender) / `#EFDBFF` (Light Lavender)
- **Tertiary**: `#755A40` (Warm Earth) / `#FED9B8` (Peach)
- **Surface**: `#FDF7FF` (Warm Off-White)
- **Typography**: Plus Jakarta Sans + Be Vietnam Pro
- **Shape**: Full pill roundness for interactive elements

## 📝 Configuration

Edit `MainActivity.kt` to customize:

```kotlin
companion object {
    private const val WEB_URL = "https://yourapp.vercel.app"  // ← Your URL
    private const val CREATE_URL = "$WEB_URL/create"
}
```

## 📱 Minimum Requirements

- **Android**: 7.0 (API 24) and above
- **Target**: Android 14 (API 34)

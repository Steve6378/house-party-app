# Yorru Android App - Complete Guide

## Overview

Converting Yorru to Android using **Capacitor** (recommended over Cordova - maintained by Ionic, better performance, modern APIs).

---

## Prerequisites Checklist

### Development Environment

- [ ] **Node.js 18+** installed
- [ ] **Android Studio** installed (includes Android SDK)
  - Download: https://developer.android.com/studio
  - Install SDK Platform: Android 13 (API 33) or higher
  - Install Build Tools 33.0.0+
  - Install Android Emulator
- [ ] **Java JDK 17** installed
  - Android Studio bundles JDK, or install separately
- [ ] **Gradle** (bundled with Android Studio)
- [ ] Set environment variables:
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

### Google Play Console Account

- [ ] **Google Play Developer Account** - $25 one-time fee
  - Sign up: https://play.google.com/console/signup
  - Requires Google account
  - Takes 24-48 hours to verify
- [ ] **D-U-N-S Number** (if publishing as organization)
  - Free from Dun & Bradstreet
  - Takes 1-2 weeks

---

## Phase 1: Project Setup

### 1.1 Install Capacitor

```bash
cd frontend
npm install @capacitor/core @capacitor/cli
npx cap init "Yorru" "net.yorru.app" --web-dir dist
```

### 1.2 Add Android Platform

```bash
npm install @capacitor/android
npx cap add android
```

### 1.3 Configure Capacitor

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.yorru.app',
  appName: 'Yorru',
  webDir: 'dist',
  server: {
    // For development - remove in production
    url: 'http://10.0.2.2:5173', // Android emulator localhost
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  android: {
    allowMixedContent: true // For dev only
  }
};

export default config;
```

### 1.4 Build & Sync

```bash
npm run build
npx cap sync android
```

---

## Phase 2: Native Plugins

### 2.1 Essential Plugins

```bash
# Camera (for profile photos)
npm install @capacitor/camera

# Push Notifications
npm install @capacitor/push-notifications

# Local Notifications (reminders)
npm install @capacitor/local-notifications

# Geolocation (event discovery)
npm install @capacitor/geolocation

# Share (share events)
npm install @capacitor/share

# App (deep links, state)
npm install @capacitor/app

# Haptics (feedback)
npm install @capacitor/haptics

# Status Bar
npm install @capacitor/status-bar

# Keyboard (better input handling)
npm install @capacitor/keyboard

# Network (offline detection)
npm install @capacitor/network

# Storage (offline data)
npm install @capacitor/preferences
```

### 2.2 Sync Plugins

```bash
npx cap sync android
```

### 2.3 Update Frontend Code

Create `src/utils/native.ts`:

```typescript
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';
import { PushNotifications } from '@capacitor/push-notifications';

export const isNative = Capacitor.isNativePlatform();

export const takePicture = async () => {
  if (!isNative) return null;

  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });

  return image.webPath;
};

export const getCurrentPosition = async () => {
  const position = await Geolocation.getCurrentPosition();
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };
};

export const shareEvent = async (event: { name: string; url: string }) => {
  await Share.share({
    title: event.name,
    text: `Check out this event: ${event.name}`,
    url: event.url,
    dialogTitle: 'Share Event'
  });
};

export const initPushNotifications = async () => {
  if (!isNative) return;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }

  PushNotifications.addListener('registration', (token) => {
    console.log('Push token:', token.value);
    // Send to backend: POST /api/auth/me/push-token
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });
};
```

---

## Phase 3: Android Configuration

### 3.1 App Icons & Splash Screen

Create icons in these sizes:
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

Use Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/

### 3.2 Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <!-- Internet -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Camera -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- Location -->
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

    <!-- Storage (for photos) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <!-- Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Vibration -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:usesCleartextTraffic="true"
        ...>
    </application>
</manifest>
```

### 3.3 Deep Links (Optional)

Add to AndroidManifest.xml inside `<activity>`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="app.yorru.net" />
</intent-filter>
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="yorru" android:host="event" />
</intent-filter>
```

---

## Phase 4: Firebase Setup (Push Notifications)

### 4.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Create new project "Yorru"
3. Add Android app with package name `net.yorru.app`
4. Download `google-services.json`
5. Place in `android/app/google-services.json`

### 4.2 Configure Gradle

Edit `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Edit `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

---

## Phase 5: Build & Test

### 5.1 Development Build

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### 5.2 Run on Emulator

In Android Studio:
1. Tools > Device Manager > Create Device
2. Select Pixel 6, API 33
3. Click Play button

Or via CLI:
```bash
npx cap run android
```

### 5.3 Run on Physical Device

1. Enable Developer Options on phone
2. Enable USB Debugging
3. Connect via USB
4. Run: `npx cap run android --target <device-id>`

---

## Phase 6: Production Build

### 6.1 Generate Signing Key

```bash
keytool -genkey -v -keystore yorru-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias yorru

# Store password securely!
# Keep yorru-release-key.jks SAFE - you need it for all updates
```

### 6.2 Configure Signing

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('yorru-release-key.jks')
            storePassword System.getenv('KEYSTORE_PASSWORD')
            keyAlias 'yorru'
            keyPassword System.getenv('KEY_PASSWORD')
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 6.3 Build Release APK/AAB

```bash
# Set passwords
export KEYSTORE_PASSWORD="your_password"
export KEY_PASSWORD="your_password"

# Build AAB (required for Play Store)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Phase 7: Google Play Store Submission

### 7.1 Prepare Store Listing

Required assets:
- [ ] **App Icon**: 512x512 PNG
- [ ] **Feature Graphic**: 1024x500 PNG
- [ ] **Screenshots**: 2-8 per device type
  - Phone: 16:9 or 9:16 (1080x1920 recommended)
  - Tablet 7": 16:9
  - Tablet 10": 16:9
- [ ] **Short Description**: Max 80 chars
- [ ] **Full Description**: Max 4000 chars
- [ ] **Privacy Policy URL**: Required (host on yorru.net/privacy)

### 7.2 Create App in Play Console

1. Go to https://play.google.com/console
2. Create app > Enter details
3. Set up:
   - App access (open/restricted)
   - Ads declaration
   - Content rating questionnaire
   - Target audience
   - News apps declaration
   - COVID-19 apps declaration
   - Data safety form

### 7.3 Upload AAB

1. Production > Create new release
2. Upload `app-release.aab`
3. Add release notes
4. Review and roll out

### 7.4 Review Timeline

- First submission: 3-7 days
- Updates: 1-3 days
- Rejections: Fix issues, resubmit

---

## Phase 8: Hosting & Backend

### Current Setup (Keep)

- **Frontend**: Vercel (web) + Play Store (Android)
- **Backend**: Railway
- **Database**: Railway PostgreSQL

### Android-Specific Considerations

1. **API URL**: Use production URL in capacitor.config.ts for release
2. **Push Notifications**: Need backend endpoint to store FCM tokens
3. **Deep Links**: Configure `assetlinks.json` on yorru.net

### Add to Backend

```python
# backend/routes/auth.py

@router.post("/me/push-token")
def register_push_token(
    token_data: PushTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register FCM push token for Android notifications."""
    current_user.fcm_token = token_data.token
    current_user.device_type = token_data.device_type  # 'android' or 'ios'
    db.commit()
    return {"message": "Token registered"}
```

---

## Quick Reference Commands

```bash
# Development
npm run build && npx cap sync android && npx cap run android

# Open Android Studio
npx cap open android

# Build release
cd android && ./gradlew bundleRelease

# Check connected devices
adb devices

# Install APK directly
adb install android/app/build/outputs/apk/release/app-release.apk

# View logs
adb logcat | grep -i capacitor
```

---

## Estimated Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | Project Setup | 1 hour |
| 2 | Native Plugins | 2 hours |
| 3 | Android Config | 2 hours |
| 4 | Firebase Setup | 1 hour |
| 5 | Build & Test | 2 hours |
| 6 | Production Build | 1 hour |
| 7 | Store Submission | 2-4 hours |
| 8 | Review Wait | 3-7 days |

**Total Active Work: ~12 hours**
**Total Calendar Time: ~1-2 weeks** (including review)

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Google Play Developer | $25 | One-time |
| Firebase (free tier) | $0 | Monthly |
| Vercel (frontend) | $0-20 | Monthly |
| Railway (backend) | $5-20 | Monthly |

---

## Files to Create

After running setup, you'll have:

```
frontend/
├── capacitor.config.ts       # Capacitor config
├── android/                  # Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/          # Icons, splash
│   │   ├── build.gradle
│   │   └── google-services.json  # Firebase
│   └── build.gradle
└── src/
    └── utils/
        └── native.ts         # Native API wrappers
```

---

## Next Steps (When Ready)

1. Run Phase 1 commands
2. Create Firebase project
3. Design app icon
4. Create screenshots
5. Write store description
6. Submit to Play Store

Good luck!

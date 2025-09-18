# Mobile App Build Guide

## Prerequisites

### For iOS (IPA):
1. **Apple Developer Account** ($99/year)
2. **Xcode** (latest version)
3. **CocoaPods**: `sudo gem install cocoapods`
4. **Provisioning Profile & Certificates** configured in Xcode

### For Android (AAB):
1. **Android Studio**
2. **Java JDK 11 or higher**
3. **Android SDK** (API level 21+)
4. **Keystore file** for signing

## Step-by-Step Build Process

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/YangSeungWon/voca-web.git
cd voca-web

# Install dependencies
npm install
```

### 2. Build Android AAB

```bash
# Use the automated script
./build-mobile.sh android release

# OR manually:
cd android

# Create keystore (first time only)
keytool -genkey -v -keystore voca-web.keystore \
  -alias voca-web \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Build AAB for Play Store
./gradlew bundleRelease

# Sign the AAB
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore voca-web.keystore \
  app/build/outputs/bundle/release/app-release.aab \
  voca-web

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 3. Build iOS IPA

```bash
# Use the automated script
./build-mobile.sh ios release

# OR manually:
cd ios/App

# Install pods
pod install

# Open in Xcode
open App.xcworkspace

# In Xcode:
# 1. Select your team in Signing & Capabilities
# 2. Choose "Any iOS Device" as build target
# 3. Product → Archive
# 4. Distribute App → App Store Connect → Upload
```

## Quick Commands

### Build both platforms:
```bash
./build-mobile.sh both release
```

### Build APK for testing:
```bash
./build-mobile.sh android debug
```

### Build for iOS Simulator:
```bash
./build-mobile.sh ios debug
```

## Signing Configuration

### Android - Create `android/keystore.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=voca-web
storeFile=../voca-web.keystore
```

### Android - Update `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
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

### iOS - Configure in Xcode:
1. Open `ios/App/App.xcworkspace`
2. Select the project in navigator
3. Go to "Signing & Capabilities"
4. Select your Team
5. Choose provisioning profile (Automatic or Manual)

## Upload to Stores

### Google Play Store:
1. Go to [Play Console](https://play.google.com/console)
2. Create new app
3. Upload AAB file
4. Fill in app details
5. Submit for review

### Apple App Store:
1. Use Xcode's Organizer to upload
2. Or use Transporter app
3. Go to [App Store Connect](https://appstoreconnect.apple.com)
4. Complete app information
5. Submit for review

## Important Notes

- **Keep your keystore safe!** You need the same keystore for all app updates
- **Never commit keystores or passwords to git**
- **Test on real devices before submitting**
- **Both stores require app review (2-7 days typically)**

## Troubleshooting

### iOS Build Errors:
```bash
# Clean build
cd ios/App
rm -rf ~/Library/Developer/Xcode/DerivedData
pod deintegrate && pod install
```

### Android Build Errors:
```bash
# Clean build
cd android
./gradlew clean
rm -rf .gradle
./gradlew assembleRelease
```

### Capacitor Sync Issues:
```bash
# Rebuild everything
rm -rf node_modules ios android
npm install
npx cap add ios
npx cap add android
./build-mobile.sh both release
```
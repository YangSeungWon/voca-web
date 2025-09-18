# Android Keystore Setup

## 1. Create a keystore (first time only)
```bash
keytool -genkey -v -keystore voca-web.keystore \
  -alias voca-web \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

## 2. Sign the APK
```bash
# Sign the APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore voca-web.keystore \
  voca-web-release.apk \
  voca-web

# Verify signature
jarsigner -verify -verbose -certs voca-web-release.apk

# Zipalign the APK
zipalign -v 4 voca-web-release.apk voca-web-aligned.apk
```

## 3. Create AAB (Android App Bundle) for Play Store
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Important: Keep your keystore safe!
- Store `voca-web.keystore` in a secure location
- Never commit the keystore to git
- Keep the keystore password secure
- You'll need the same keystore for all future app updates
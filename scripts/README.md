# Build Scripts

This directory contains build automation scripts for the Voca app.

## iOS Build Script

Complete build pipeline for iOS: Next.js static export → Capacitor sync → Xcode archive → IPA export

### Usage

```bash
# Development build (default)
./scripts/build-ios.sh

# App Store build
./scripts/build-ios.sh --appstore

# Skip Next.js build (useful when only Xcode changes)
./scripts/build-ios.sh --skip-build
```

### What it does

1. **Next.js Static Export** (Step 1/6)
   - Temporarily moves `src/app/api` to `/tmp` (required for static export)
   - Runs `npm run build`
   - Restores API folder

2. **Capacitor Sync** (Step 2/6)
   - Copies web assets from `out/` to `ios/App/App/public/`
   - Creates `capacitor.config.json` in iOS app
   - CocoaPods errors are expected and ignored

3. **Xcode Clean** (Step 3/6)
   - Cleans previous build artifacts

4. **Build Archive** (Step 4/6)
   - Creates `.xcarchive` for distribution
   - Takes 2-3 minutes

5. **Export IPA** (Step 5/6)
   - Development: `ios/App/build-dev/App.ipa`
   - App Store: `ios/App/build-appstore/App.ipa`

6. **Summary** (Step 6/6)
   - Shows archive location, IPA path, and file size
   - Provides next steps

### Output

- **Archive**: `ios/App/build/App.xcarchive`
- **Development IPA**: `ios/App/build-dev/App.ipa`
- **App Store IPA**: `ios/App/build-appstore/App.ipa`

### Options

- `--appstore`: Build for App Store distribution
- `--skip-build`: Skip Next.js build (faster when only iOS changes)

### Examples

```bash
# Full development build (for testing on device)
./scripts/build-ios.sh

# Quick rebuild after iOS-only changes
./scripts/build-ios.sh --skip-build

# App Store build
./scripts/build-ios.sh --appstore
```

### Installation

Install IPA on device:

```bash
# Method 1: Xcode Devices window
# Press Cmd+Shift+2, then drag IPA to device

# Method 2: Command line
xcrun devicectl device install app --device <DEVICE_ID> ios/App/build-dev/App.ipa
```

### Troubleshooting

**CocoaPods errors during Capacitor sync**
- These are expected and can be ignored
- The script automatically handles this

**Archive build fails**
- Make sure Xcode is properly configured
- Check signing certificates and provisioning profiles

**IPA export fails**
- Verify `ExportOptionsDev.plist` or `ExportOptionsAppStore.plist` exists
- Check provisioning profile settings

## Android Build Script

```bash
./scripts/build-android.sh
```

Builds Android APK with icon generation.

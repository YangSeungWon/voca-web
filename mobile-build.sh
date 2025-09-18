#!/bin/bash

echo "Building Voca Web mobile app..."

# 1. Remove API routes temporarily
echo "Moving API routes for static build..."
mv src/app/api src/app/_api_backup 2>/dev/null || true

# 2. Build static export
echo "Building static export..."
BUILD_MODE=static npm run build:static

# 3. Restore API routes
echo "Restoring API routes..."
mv src/app/_api_backup src/app/api 2>/dev/null || true

# 4. Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

echo "✅ Mobile app build complete!"
echo ""
echo "To test the app:"
echo "  Android: npx cap open android (requires Android Studio)"
echo "  iOS: npx cap open ios (requires Xcode on macOS)"
echo ""
echo "To build APK/IPA:"
echo "  Android: Open in Android Studio and build"
echo "  iOS: Open in Xcode and archive"
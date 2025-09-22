#!/bin/bash

# Android Build Script for Voca App
# This script handles all the Android build process including APK and AAB generation

set -e  # Exit on error

echo "🚀 Starting Android build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Step 1: Build Next.js project
echo -e "${YELLOW}🔨 Building Next.js project...${NC}"
npm run build

# Step 2: Sync with Capacitor
echo -e "${YELLOW}🔄 Syncing with Capacitor...${NC}"
npx cap sync android

# Step 3: Clean Android build
echo -e "${YELLOW}🧹 Cleaning Android build...${NC}"
cd android
./gradlew clean

# Step 4: Build APK and AAB
echo -e "${YELLOW}📦 Building Android APK and AAB...${NC}"
./gradlew assembleRelease bundleRelease

# Step 5: Check output files
APK_PATH="app/build/outputs/apk/release/app-release.apk"
AAB_PATH="app/build/outputs/bundle/release/app-release.aab"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "${GREEN}✅ APK built successfully: $APK_PATH (${APK_SIZE})${NC}"
else
    echo -e "${RED}❌ APK build failed${NC}"
    exit 1
fi

if [ -f "$AAB_PATH" ]; then
    AAB_SIZE=$(du -h "$AAB_PATH" | cut -f1)
    echo -e "${GREEN}✅ AAB built successfully: $AAB_PATH (${AAB_SIZE})${NC}"
else
    echo -e "${RED}❌ AAB build failed${NC}"
    exit 1
fi

# Step 6: Copy outputs to a convenient location (optional)
if [ "$1" == "--copy-outputs" ]; then
    OUTPUT_DIR="$PROJECT_ROOT/build-outputs"
    mkdir -p "$OUTPUT_DIR"

    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    cp "$APK_PATH" "$OUTPUT_DIR/voca_${TIMESTAMP}.apk"
    cp "$AAB_PATH" "$OUTPUT_DIR/voca_${TIMESTAMP}.aab"

    echo -e "${GREEN}✅ Build outputs copied to: $OUTPUT_DIR${NC}"
fi

echo -e "${GREEN}✅ Android build completed successfully!${NC}"
echo ""
echo "📱 Output files:"
echo "  APK: android/$APK_PATH"
echo "  AAB: android/$AAB_PATH"
echo ""
echo "📤 Next steps:"
echo "  For Play Store: Upload the AAB file to Google Play Console"
echo "  For testing: Install the APK directly on a device"
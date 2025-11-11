#!/bin/bash

# iOS Build Script for Voca App
# This script handles all the iOS build process including icon generation and archive creation

set -e  # Exit on error

echo "🚀 Starting iOS build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Step 1: Generate iOS app icon and copy to public
echo -e "${YELLOW}📱 Generating iOS app icon...${NC}"
if [ -f "voca.png" ]; then
    node scripts/generate-ios-icon.js
    # Copy icon to public folder for app use
    cp voca.png public/voca-icon.png
    echo -e "${GREEN}✅ iOS app icon generated successfully${NC}"
else
    echo -e "${RED}❌ Error: voca.png not found in project root${NC}"
    exit 1
fi

# Step 2: Build Next.js project
echo -e "${YELLOW}🔨 Building Next.js project...${NC}"
npm run build

# Step 3: Sync with Capacitor
echo -e "${YELLOW}🔄 Syncing with Capacitor...${NC}"
npx cap sync ios

# Step 4: Clean and reinstall pods
echo -e "${YELLOW}🧹 Cleaning and reinstalling CocoaPods...${NC}"
cd ios/App
rm -rf build build-appstore Pods Podfile.lock
pod install

# Step 5: Clean Xcode build
echo -e "${YELLOW}🧹 Cleaning Xcode build...${NC}"
xcodebuild clean -workspace App.xcworkspace -scheme App -configuration Release

# Step 6: Build archive
echo -e "${YELLOW}📦 Building iOS archive...${NC}"
xcodebuild -workspace App.xcworkspace \
    -scheme App \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    -archivePath build/App.xcarchive \
    archive

# Step 7: Export IPA (optional, for development testing)
if [ "$1" == "--export-ipa" ]; then
    echo -e "${YELLOW}📤 Exporting IPA...${NC}"
    xcodebuild -exportArchive \
        -archivePath build/App.xcarchive \
        -exportPath build \
        -exportOptionsPlist ExportOptions.plist

    if [ -f "build/App.ipa" ]; then
        echo -e "${GREEN}✅ IPA exported: build/App.ipa${NC}"
    fi
fi

# Step 8: Check bundle identifiers
echo -e "${YELLOW}🔍 Verifying bundle identifiers...${NC}"
MAIN_BUNDLE_ID=$(plutil -convert xml1 -o - ./build/App.xcarchive/Products/Applications/App.app/Info.plist | grep -A1 CFBundleIdentifier | tail -1 | sed 's/.*<string>\(.*\)<\/string>/\1/')
CAPACITOR_BUNDLE_ID=$(plutil -convert xml1 -o - ./build/App.xcarchive/Products/Applications/App.app/Frameworks/Capacitor.framework/Info.plist | grep -A1 CFBundleIdentifier | tail -1 | sed 's/.*<string>\(.*\)<\/string>/\1/')
CORDOVA_BUNDLE_ID=$(plutil -convert xml1 -o - ./build/App.xcarchive/Products/Applications/App.app/Frameworks/Cordova.framework/Info.plist | grep -A1 CFBundleIdentifier | tail -1 | sed 's/.*<string>\(.*\)<\/string>/\1/')

echo "Main App: $MAIN_BUNDLE_ID"
echo "Capacitor: $CAPACITOR_BUNDLE_ID"
echo "Cordova: $CORDOVA_BUNDLE_ID"

if [ "$MAIN_BUNDLE_ID" == "$CAPACITOR_BUNDLE_ID" ] || [ "$MAIN_BUNDLE_ID" == "$CORDOVA_BUNDLE_ID" ]; then
    echo -e "${RED}❌ Bundle identifier collision detected!${NC}"
    echo "Please run 'pod deintegrate && pod install' and rebuild"
    exit 1
fi

echo -e "${GREEN}✅ iOS build completed successfully!${NC}"
echo -e "${GREEN}Archive location: ios/App/build/App.xcarchive${NC}"
echo ""
echo "📱 Next steps:"
echo "1. Open Xcode and go to Window > Organizer"
echo "2. Select your archive and click 'Distribute App'"
echo "3. Follow the App Store Connect upload process"
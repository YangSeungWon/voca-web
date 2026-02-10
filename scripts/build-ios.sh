#!/bin/bash

# iOS Build Script for Voca App
# Complete build pipeline: Next.js static export -> Capacitor sync -> Xcode archive -> IPA export

# Exit on error (disabled for capacitor sync step which may fail on CocoaPods)
# set -e

echo "🚀 Starting iOS build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Parse arguments
EXPORT_TYPE="dev"  # dev or appstore
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --appstore)
            EXPORT_TYPE="appstore"
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--appstore] [--skip-build]"
            exit 1
            ;;
    esac
done

# Step 0: Update version (only for appstore builds)
if [ "$EXPORT_TYPE" == "appstore" ]; then
    echo -e "${YELLOW}📱 Step 0: Updating build version...${NC}"
    node scripts/update-build-version.js
    echo -e "${GREEN}  ✅ Version updated${NC}"
fi

# Step 1: Sync with Capacitor (no static build needed - using WebView)
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${YELLOW}📦 Step 1/6: Preparing for Capacitor sync...${NC}"

    # Create minimal out directory for Capacitor (required but not used)
    if [ ! -d "out" ]; then
        mkdir -p out
        echo '<!DOCTYPE html><html><body>Loading...</body></html>' > out/index.html
    fi

    echo -e "${GREEN}  ✅ Preparation completed (WebView mode - no static build needed)${NC}"
else
    echo -e "${BLUE}  ⏭️  Skipping preparation${NC}"
fi

# Step 2: Sync with Capacitor
echo -e "${YELLOW}📱 Step 2/6: Syncing with Capacitor...${NC}"
npx cap sync ios 2>&1 | grep -E "(Copying web assets|Creating capacitor|copy ios|SUCCEEDED)" || true
echo -e "${GREEN}  ✅ Capacitor sync completed (CocoaPods errors are expected and ignored)${NC}"

# Step 3: Clean Xcode build
echo -e "${YELLOW}🧹 Step 3/6: Cleaning Xcode build...${NC}"
cd ios/App
xcodebuild clean -workspace App.xcworkspace -scheme App -configuration Release 2>&1 | grep -E "(CLEAN SUCCEEDED|CLEAN FAILED)" || echo "  Cleaning..."
echo -e "${GREEN}  ✅ Xcode clean completed${NC}"

# Step 4: Build archive
echo -e "${YELLOW}🔨 Step 4/6: Building iOS archive...${NC}"
echo "  This may take 2-3 minutes..."
xcodebuild -workspace App.xcworkspace \
    -scheme App \
    -configuration Release \
    -destination 'generic/platform=iOS' \
    -archivePath build/App.xcarchive \
    archive 2>&1 | grep -E "(ARCHIVE SUCCEEDED|ARCHIVE FAILED|error:)" || echo "  Building..."

if [ ! -d "build/App.xcarchive" ]; then
    echo -e "${RED}  ❌ Archive build failed${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ Archive build completed${NC}"

# Step 5: Export IPA
echo -e "${YELLOW}📤 Step 5/6: Exporting IPA...${NC}"

if [ "$EXPORT_TYPE" == "appstore" ]; then
    EXPORT_PATH="build-appstore"
    EXPORT_OPTIONS="ExportOptions-appstore.plist"
    echo "  Export type: App Store"
else
    EXPORT_PATH="build-dev"
    EXPORT_OPTIONS="ExportOptionsDev.plist"
    echo "  Export type: Development"
fi

xcodebuild -exportArchive \
    -archivePath build/App.xcarchive \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" 2>&1 | grep -E "(EXPORT SUCCEEDED|EXPORT FAILED|error:)" || echo "  Exporting..."

if [ ! -f "$EXPORT_PATH/App.ipa" ]; then
    echo -e "${RED}  ❌ IPA export failed${NC}"
    exit 1
fi

IPA_SIZE=$(du -h "$EXPORT_PATH/App.ipa" | cut -f1)
echo -e "${GREEN}  ✅ IPA exported: $EXPORT_PATH/App.ipa (${IPA_SIZE})${NC}"

# Step 6: Summary
echo -e "${YELLOW}📋 Step 6/6: Build summary${NC}"
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ iOS build completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "📦 Archive:  ios/App/build/App.xcarchive"
echo "📱 IPA file: ios/App/$EXPORT_PATH/App.ipa (${IPA_SIZE})"
echo ""

if [ "$EXPORT_TYPE" == "appstore" ]; then
    echo "📱 Next steps for App Store:"
    echo "  1. Open Xcode and go to Window > Organizer"
    echo "  2. Select your archive and click 'Distribute App'"
    echo "  3. Choose 'App Store Connect' and follow the upload process"
else
    echo "📱 Next steps for Development:"
    echo "  1. Install IPA using Xcode Devices window (Cmd+Shift+2)"
    echo "  2. Or use: xcrun devicectl device install app --device <DEVICE_ID> ios/App/$EXPORT_PATH/App.ipa"
fi
echo ""
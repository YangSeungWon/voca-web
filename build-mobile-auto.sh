#!/bin/bash

# Voca Web Fully Automated Mobile Build Script
# Builds both Android AAB and iOS IPA with proper signing
# Prerequisites:
# - Xcode with valid Apple Developer account
# - Android Studio with keystore configured
# - CocoaPods installed
# - Java JDK 17+ installed

set -e  # Exit on error

echo "🚀 Voca Web Automated Build Script"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUNDLE_ID="kr.ysw.vocabulary"
TEAM_ID="4329B4KBY7"
ANDROID_PACKAGE="kr.ysw.voca"

# Build type selection
PLATFORM=${1:-both}
BUILD_TYPE=${2:-release}

echo -e "${BLUE}Platform: $PLATFORM${NC}"
echo -e "${BLUE}Build Type: $BUILD_TYPE${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi

    # Check Java
    if ! command -v java &> /dev/null; then
        echo -e "${RED}❌ Java is not installed${NC}"
        exit 1
    fi

    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        echo -e "${RED}❌ Java 17+ required (found Java $JAVA_VERSION)${NC}"
        exit 1
    fi

    # Check CocoaPods for iOS
    if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
        if ! command -v pod &> /dev/null; then
            echo -e "${YELLOW}⚠️  CocoaPods not installed. Installing...${NC}"
            sudo gem install cocoapods
        fi
    fi

    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"

    if [ ! -d "node_modules" ]; then
        npm install
    fi

    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Function to build static export
build_static() {
    echo -e "${YELLOW}🔨 Building static export...${NC}"

    # Temporarily move API routes
    if [ -d "src/app/api" ]; then
        mv src/app/api src/app/_api_backup 2>/dev/null || true
    fi

    # Build static export
    BUILD_MODE=static npm run build:static

    # Restore API routes
    if [ -d "src/app/_api_backup" ]; then
        mv src/app/_api_backup src/app/api 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ Static export complete${NC}"
}

# Function to sync Capacitor
sync_capacitor() {
    echo -e "${YELLOW}🔄 Syncing Capacitor...${NC}"
    npx cap sync
    echo -e "${GREEN}✓ Capacitor sync complete${NC}"
}

# Function to build Android AAB
build_android() {
    echo -e "${YELLOW}🤖 Building Android AAB...${NC}"

    cd android

    # Clean previous builds
    ./gradlew clean

    if [ "$BUILD_TYPE" == "release" ]; then
        echo -e "${BLUE}Building Android Release AAB...${NC}"

        # Build release AAB
        ./gradlew bundleRelease

        # Check if AAB was created
        if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
            # Create output directory
            mkdir -p ../build-output

            # Copy AAB to output directory
            cp app/build/outputs/bundle/release/app-release.aab ../build-output/voca-web-$ANDROID_PACKAGE.aab

            echo -e "${GREEN}✓ Android AAB created at: build-output/voca-web-$ANDROID_PACKAGE.aab${NC}"
            echo -e "${GREEN}  Package: $ANDROID_PACKAGE${NC}"
            echo -e "${GREEN}  Size: $(ls -lh ../build-output/voca-web-$ANDROID_PACKAGE.aab | awk '{print $5}')${NC}"
        else
            echo -e "${RED}❌ AAB build failed${NC}"
            exit 1
        fi
    else
        echo -e "${BLUE}Building Android Debug APK...${NC}"

        # Build debug APK
        ./gradlew assembleDebug

        # Create output directory
        mkdir -p ../build-output

        # Copy APK to output directory
        cp app/build/outputs/apk/debug/app-debug.apk ../build-output/voca-web-debug.apk

        echo -e "${GREEN}✓ Android Debug APK created at: build-output/voca-web-debug.apk${NC}"
    fi

    cd ..
}

# Function to build iOS IPA
build_ios() {
    echo -e "${YELLOW}📱 Building iOS IPA...${NC}"

    cd ios/App

    # Install CocoaPods dependencies
    echo "Installing CocoaPods dependencies..."
    pod install

    if [ "$BUILD_TYPE" == "release" ]; then
        echo -e "${BLUE}Building iOS Release IPA...${NC}"

        # Clean build folder
        rm -rf build
        mkdir -p build

        # Build archive with automatic signing
        echo "Creating archive..."
        xcodebuild -workspace App.xcworkspace \
                   -scheme App \
                   -configuration Release \
                   -archivePath ./build/App.xcarchive \
                   -destination 'generic/platform=iOS' \
                   -allowProvisioningUpdates \
                   archive \
                   DEVELOPMENT_TEAM=$TEAM_ID \
                   PRODUCT_BUNDLE_IDENTIFIER=$BUNDLE_ID

        # Create export options plist
        cat > ExportOptions-auto.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

        # Export IPA
        echo "Exporting IPA..."
        xcodebuild -exportArchive \
                   -archivePath ./build/App.xcarchive \
                   -exportOptionsPlist ExportOptions-auto.plist \
                   -exportPath ./build \
                   -allowProvisioningUpdates

        # Check if IPA was created
        if [ -f "build/App.ipa" ]; then
            # Create output directory
            mkdir -p ../../build-output

            # Copy IPA to output directory
            cp build/App.ipa ../../build-output/voca-web-$BUNDLE_ID.ipa

            echo -e "${GREEN}✓ iOS IPA created at: build-output/voca-web-$BUNDLE_ID.ipa${NC}"
            echo -e "${GREEN}  Bundle ID: $BUNDLE_ID${NC}"
            echo -e "${GREEN}  Team ID: $TEAM_ID${NC}"
            echo -e "${GREEN}  Size: $(ls -lh ../../build-output/voca-web-$BUNDLE_ID.ipa | awk '{print $5}')${NC}"
        else
            echo -e "${RED}❌ IPA export failed${NC}"
            exit 1
        fi

        # Clean up
        rm -f ExportOptions-auto.plist
    else
        echo -e "${BLUE}Building iOS Debug...${NC}"

        # Build for simulator
        xcodebuild -workspace App.xcworkspace \
                   -scheme App \
                   -configuration Debug \
                   -sdk iphonesimulator \
                   -derivedDataPath build \
                   build

        echo -e "${GREEN}✓ iOS Debug build complete${NC}"
    fi

    cd ../..
}

# Function to show build summary
show_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ BUILD SUCCESSFUL!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""

    if [ "$BUILD_TYPE" == "release" ]; then
        echo -e "${BLUE}📦 Build Artifacts:${NC}"
        echo ""

        if [ -d "build-output" ]; then
            ls -lah build-output/*.aab 2>/dev/null && echo ""
            ls -lah build-output/*.ipa 2>/dev/null && echo ""
        fi

        echo -e "${YELLOW}📤 Next Steps:${NC}"
        echo ""

        if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]]; then
            echo -e "${BLUE}Android:${NC}"
            echo "  1. Go to Google Play Console: https://play.google.com/console"
            echo "  2. Upload AAB file from build-output/"
            echo "  3. Complete app listing and submit for review"
            echo ""
        fi

        if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]]; then
            echo -e "${BLUE}iOS:${NC}"
            echo "  1. Open Transporter app or use Xcode"
            echo "  2. Upload IPA file from build-output/"
            echo "  3. Go to App Store Connect: https://appstoreconnect.apple.com"
            echo "  4. Complete app information and submit for review"
            echo ""
        fi
    fi
}

# Main execution
main() {
    echo -e "${YELLOW}🏗️  Starting automated build process...${NC}"
    echo ""

    # Check prerequisites
    check_prerequisites

    # Install dependencies
    install_dependencies

    # Build static export
    build_static

    # Sync Capacitor
    sync_capacitor

    # Build based on platform selection
    case $PLATFORM in
        ios)
            if [[ "$OSTYPE" != "darwin"* ]]; then
                echo -e "${RED}❌ iOS builds require macOS${NC}"
                exit 1
            fi
            build_ios
            ;;

        android)
            build_android
            ;;

        both)
            if [[ "$OSTYPE" == "darwin"* ]]; then
                build_ios
            else
                echo -e "${YELLOW}⚠️  Skipping iOS build (requires macOS)${NC}"
            fi
            build_android
            ;;

        *)
            echo -e "${RED}❌ Invalid platform: $PLATFORM${NC}"
            echo "Usage: $0 [ios|android|both] [debug|release]"
            exit 1
            ;;
    esac

    # Show summary
    show_summary
}

# Run main function
main
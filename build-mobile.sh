#!/bin/bash

# Voca Web Mobile Build Script for macOS
# Prerequisites:
# - Xcode and Xcode Command Line Tools installed
# - Android Studio and Android SDK installed
# - CocoaPods installed (sudo gem install cocoapods)
# - Java JDK installed

set -e  # Exit on error

echo "🚀 Voca Web Mobile Build Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build type selection
if [ -z "$1" ]; then
    echo "Usage: $0 [ios|android|both] [debug|release]"
    echo ""
    echo "Examples:"
    echo "  $0 ios debug      # Build iOS debug version"
    echo "  $0 android release # Build Android release APK"
    echo "  $0 both release    # Build both platforms in release mode"
    exit 1
fi

PLATFORM=$1
BUILD_TYPE=${2:-debug}

echo -e "${YELLOW}Platform: $PLATFORM${NC}"
echo -e "${YELLOW}Build Type: $BUILD_TYPE${NC}"
echo ""

# Function to build static export
build_static() {
    echo -e "${GREEN}📦 Building static export...${NC}"
    
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
    echo -e "${GREEN}🔄 Syncing Capacitor...${NC}"
    npx cap sync
    echo -e "${GREEN}✓ Capacitor sync complete${NC}"
}

# Function to build iOS
build_ios() {
    echo -e "${GREEN}📱 Building iOS app...${NC}"
    
    # Navigate to iOS directory
    cd ios/App
    
    # Install CocoaPods dependencies
    echo "Installing CocoaPods dependencies..."
    pod install
    
    if [ "$BUILD_TYPE" == "release" ]; then
        echo -e "${YELLOW}Building iOS Release...${NC}"
        
        # Build archive
        xcodebuild -workspace App.xcworkspace \
                   -scheme App \
                   -configuration Release \
                   -archivePath build/VocaWeb.xcarchive \
                   archive \
                   CODE_SIGN_IDENTITY="" \
                   CODE_SIGNING_REQUIRED=NO \
                   CODE_SIGNING_ALLOWED=NO
        
        # Export IPA (unsigned for now)
        xcodebuild -exportArchive \
                   -archivePath build/VocaWeb.xcarchive \
                   -exportPath build \
                   -exportOptionsPlist ../../ios-export-options.plist
        
        echo -e "${GREEN}✓ iOS IPA created at: ios/App/build/App.ipa${NC}"
    else
        echo -e "${YELLOW}Building iOS Debug...${NC}"
        
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

# Function to build Android
build_android() {
    echo -e "${GREEN}🤖 Building Android app...${NC}"
    
    # Navigate to Android directory
    cd android
    
    # Clean previous builds
    ./gradlew clean
    
    if [ "$BUILD_TYPE" == "release" ]; then
        echo -e "${YELLOW}Building Android Release APK...${NC}"
        
        # Build release APK (unsigned)
        ./gradlew assembleRelease
        
        # Copy APK to root directory
        cp app/build/outputs/apk/release/app-release-unsigned.apk ../voca-web-release.apk
        
        echo -e "${GREEN}✓ Android APK created at: voca-web-release.apk${NC}"
        echo -e "${YELLOW}Note: APK is unsigned. Sign it before distribution.${NC}"
    else
        echo -e "${YELLOW}Building Android Debug APK...${NC}"
        
        # Build debug APK
        ./gradlew assembleDebug
        
        # Copy APK to root directory
        cp app/build/outputs/apk/debug/app-debug.apk ../voca-web-debug.apk
        
        echo -e "${GREEN}✓ Android Debug APK created at: voca-web-debug.apk${NC}"
    fi
    
    cd ..
}

# Function to run iOS simulator
run_ios_simulator() {
    echo -e "${GREEN}📱 Launching iOS Simulator...${NC}"
    npx cap run ios
}

# Function to run Android emulator
run_android_emulator() {
    echo -e "${GREEN}🤖 Launching Android Emulator...${NC}"
    npx cap run android
}

# Main build process
echo -e "${GREEN}🏗️  Starting build process...${NC}"

# Check dependencies
echo "Checking dependencies..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

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
        
        if [ "$BUILD_TYPE" == "debug" ]; then
            echo ""
            echo -e "${YELLOW}Run iOS Simulator? (y/n)${NC}"
            read -r response
            if [[ "$response" == "y" ]]; then
                run_ios_simulator
            fi
        fi
        ;;
    
    android)
        build_android
        
        if [ "$BUILD_TYPE" == "debug" ]; then
            echo ""
            echo -e "${YELLOW}Run Android Emulator? (y/n)${NC}"
            read -r response
            if [[ "$response" == "y" ]]; then
                run_android_emulator
            fi
        fi
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
        echo "Use: ios, android, or both"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "Next steps:"

if [[ "$PLATFORM" == "ios" || "$PLATFORM" == "both" ]] && [[ "$BUILD_TYPE" == "release" ]]; then
    echo "  iOS: Sign the IPA with your Apple Developer certificate"
    echo "       Upload to App Store Connect via Transporter app"
fi

if [[ "$PLATFORM" == "android" || "$PLATFORM" == "both" ]] && [[ "$BUILD_TYPE" == "release" ]]; then
    echo "  Android: Sign the APK with your keystore:"
    echo "           jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore your-keystore.jks voca-web-release.apk your-alias"
    echo "           zipalign -v 4 voca-web-release.apk voca-web-aligned.apk"
fi

echo ""
echo "📚 Documentation: https://capacitorjs.com/docs/guides/deploying-to-app-stores"
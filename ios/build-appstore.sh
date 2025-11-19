#!/bin/bash

# iOS App Store Build Script
# This script builds and exports the iOS app for App Store submission

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting App Store build process...${NC}\n"

# Configuration
PROJECT_DIR="./App"
SCHEME="App"
ARCHIVE_PATH="./App/build/App.xcarchive"
EXPORT_PATH="./App/build/ipa"
EXPORT_OPTIONS="./App/ExportOptions-appstore.plist"

# Navigate to iOS directory
cd "$(dirname "$0")"

# Step 1: Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf "$PROJECT_DIR/build"
rm -rf "$PROJECT_DIR/build-dev"

# Step 2: Install/Update Pods (skip if already installed)
if [ ! -d "$PROJECT_DIR/Pods" ]; then
  echo -e "${YELLOW}📦 Installing CocoaPods dependencies...${NC}"
  cd App
  pod install
  cd ..
else
  echo -e "${GREEN}✅ Pods already installed, skipping...${NC}"
fi

# Step 3: Build and Archive
echo -e "${YELLOW}🔨 Building and archiving...${NC}"
xcodebuild archive \
  -workspace "$PROJECT_DIR/App.xcworkspace" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic \
  | xcpretty || xcodebuild archive \
    -workspace "$PROJECT_DIR/App.xcworkspace" \
    -scheme "$SCHEME" \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates \
    CODE_SIGN_STYLE=Automatic

if [ ! -d "$ARCHIVE_PATH" ]; then
  echo -e "${RED}❌ Archive failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Archive created successfully${NC}\n"

# Step 4: Export IPA
echo -e "${YELLOW}📤 Exporting IPA...${NC}"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -allowProvisioningUpdates \
  | xcpretty || xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -allowProvisioningUpdates

if [ ! -f "$EXPORT_PATH/App.ipa" ]; then
  echo -e "${RED}❌ IPA export failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ IPA exported successfully${NC}\n"

# Show result
IPA_PATH="$(pwd)/$EXPORT_PATH/App.ipa"
IPA_SIZE=$(du -h "$IPA_PATH" | cut -f1)

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Build Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📱 IPA Location: ${YELLOW}$IPA_PATH${NC}"
echo -e "📦 Size: ${YELLOW}$IPA_SIZE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Open Transporter app"
echo -e "2. Drag and drop: ${YELLOW}$IPA_PATH${NC}"
echo -e "3. Click 'Deliver'\n"

echo -e "${YELLOW}Or use command line:${NC}"
echo -e "cd ios && ./upload-appstore.sh\n"

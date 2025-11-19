#!/bin/bash

# iOS App Store Upload Script
# This script uploads the IPA to App Store Connect using xcrun altool

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting App Store upload...${NC}\n"

# Configuration
IPA_PATH="./App/build/ipa/App.ipa"

# Navigate to iOS directory
cd "$(dirname "$0")"

# Check if IPA exists
if [ ! -f "$IPA_PATH" ]; then
  echo -e "${RED}❌ IPA not found at: $IPA_PATH${NC}"
  echo -e "${YELLOW}Run './build-appstore.sh' first to create the IPA${NC}"
  exit 1
fi

# Get Apple ID credentials
echo -e "${YELLOW}Please enter your Apple ID credentials:${NC}"
read -p "Apple ID (email): " APPLE_ID
read -sp "App-specific password: " APP_PASSWORD
echo -e "\n"

# Note: You need to create an app-specific password at https://appleid.apple.com
# Account → Security → App-Specific Passwords

echo -e "${YELLOW}📤 Uploading to App Store Connect...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}\n"

# Upload using altool (deprecated but still works) or newer notarytool
xcrun altool --upload-app \
  --type ios \
  --file "$IPA_PATH" \
  --username "$APPLE_ID" \
  --password "$APP_PASSWORD" \
  --verbose

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ Upload Complete!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  echo -e "${YELLOW}Next steps:${NC}"
  echo -e "1. Go to App Store Connect: https://appstoreconnect.apple.com"
  echo -e "2. Select your app"
  echo -e "3. The build will appear in TestFlight within ~10 minutes"
  echo -e "4. After processing, submit for App Review\n"
else
  echo -e "\n${RED}❌ Upload failed!${NC}"
  echo -e "${YELLOW}Common issues:${NC}"
  echo -e "1. App-specific password incorrect"
  echo -e "2. Apple ID doesn't have access to the app"
  echo -e "3. Network issues\n"
  exit 1
fi

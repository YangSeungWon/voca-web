#!/bin/bash

# Build All Script for Voca App
# This script builds both iOS and Android versions

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Voca App - Complete Build Process${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════${NC}"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Update build version first
echo ""
echo -e "${YELLOW}📈 Updating build version...${NC}"
node "$SCRIPT_DIR/update-build-version.js"

# Parse arguments
BUILD_IOS=true
BUILD_ANDROID=true
EXPORT_IPA=false
COPY_OUTPUTS=false

for arg in "$@"; do
    case $arg in
        --ios-only)
            BUILD_ANDROID=false
            ;;
        --android-only)
            BUILD_IOS=false
            ;;
        --export-ipa)
            EXPORT_IPA=true
            ;;
        --copy-outputs)
            COPY_OUTPUTS=true
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --ios-only       Build only iOS"
            echo "  --android-only   Build only Android"
            echo "  --export-ipa     Export IPA file for iOS"
            echo "  --copy-outputs   Copy Android outputs to build-outputs folder"
            echo "  --help           Show this help message"
            exit 0
            ;;
    esac
done

# Build iOS
if [ "$BUILD_IOS" = true ]; then
    echo ""
    echo -e "${YELLOW}📱 Building iOS...${NC}"
    echo -e "${YELLOW}──────────────────────────────────────${NC}"

    if [ "$EXPORT_IPA" = true ]; then
        bash "$SCRIPT_DIR/build-ios.sh" --export-ipa
    else
        bash "$SCRIPT_DIR/build-ios.sh"
    fi
fi

# Build Android
if [ "$BUILD_ANDROID" = true ]; then
    echo ""
    echo -e "${YELLOW}🤖 Building Android...${NC}"
    echo -e "${YELLOW}──────────────────────────────────────${NC}"

    if [ "$COPY_OUTPUTS" = true ]; then
        bash "$SCRIPT_DIR/build-android.sh" --copy-outputs
    else
        bash "$SCRIPT_DIR/build-android.sh"
    fi
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}     ✅ All builds completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
#!/bin/bash

echo "Building Chrome and Firefox extensions..."

# Chrome extension
echo "Building Chrome extension..."
cd chrome-extension
zip -r ../voca-web-chrome.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..
echo "Chrome extension built: voca-web-chrome.zip"

# Firefox extension  
echo "Building Firefox extension..."
cd firefox-extension
zip -r ../voca-web-firefox.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..
echo "Firefox extension built: voca-web-firefox.zip"

echo "Build complete!"
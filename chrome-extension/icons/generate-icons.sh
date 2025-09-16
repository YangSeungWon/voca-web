#!/bin/bash

# Create simple SVG icon
cat > icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#1f2937" rx="16"/>
  <text x="64" y="80" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="white">V</text>
</svg>
EOF

# Convert SVG to PNG using ImageMagick if available
if command -v convert &> /dev/null; then
  convert -background none -density 384 icon.svg -resize 16x16 icon-16.png
  convert -background none -density 384 icon.svg -resize 48x48 icon-48.png
  convert -background none -density 384 icon.svg -resize 128x128 icon-128.png
  echo "Icons generated successfully!"
else
  echo "ImageMagick not found. Creating placeholder icons..."
  
  # Create placeholder text files
  echo "Icon 16x16" > icon-16.png
  echo "Icon 48x48" > icon-48.png
  echo "Icon 128x128" > icon-128.png
  echo "Placeholder icons created. Please replace with actual PNG images."
fi

rm -f icon.svg
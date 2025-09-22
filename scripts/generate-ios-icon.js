const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Icon sizes for iOS
const iconSizes = [
  { size: 20, scale: 2, name: 'AppIcon-20x20@2x.png' },
  { size: 20, scale: 3, name: 'AppIcon-20x20@3x.png' },
  { size: 29, scale: 2, name: 'AppIcon-29x29@2x.png' },
  { size: 29, scale: 3, name: 'AppIcon-29x29@3x.png' },
  { size: 40, scale: 2, name: 'AppIcon-40x40@2x.png' },
  { size: 40, scale: 3, name: 'AppIcon-40x40@3x.png' },
  { size: 60, scale: 2, name: 'AppIcon-60x60@2x.png' },
  { size: 60, scale: 3, name: 'AppIcon-60x60@3x.png' },
  { size: 1024, scale: 1, name: 'AppIcon-1024x1024.png' }
];

const projectRoot = path.join(__dirname, '..');
const sourcePath = path.join(projectRoot, 'voca.png');
const targetDir = path.join(projectRoot, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');

// Check if source file exists
if (!fs.existsSync(sourcePath)) {
  console.error('Error: voca.png not found in project root');
  process.exit(1);
}

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Generating iOS app icons...');

// Generate each icon size
iconSizes.forEach(icon => {
  const actualSize = icon.size * icon.scale;
  const outputPath = path.join(targetDir, icon.name);

  try {
    // Use sips (built-in macOS tool) to resize
    execSync(`sips -z ${actualSize} ${actualSize} "${sourcePath}" --out "${outputPath}"`, {
      stdio: 'pipe'
    });
    console.log(`✓ Generated ${icon.name} (${actualSize}x${actualSize})`);
  } catch (error) {
    console.error(`Failed to generate ${icon.name}:`, error.message);
  }
});

// Create Contents.json
const contentsJson = {
  "images": [
    {
      "filename": "AppIcon-20x20@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "20x20"
    },
    {
      "filename": "AppIcon-20x20@3x.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "20x20"
    },
    {
      "filename": "AppIcon-29x29@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "29x29"
    },
    {
      "filename": "AppIcon-29x29@3x.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "29x29"
    },
    {
      "filename": "AppIcon-40x40@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "40x40"
    },
    {
      "filename": "AppIcon-40x40@3x.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "40x40"
    },
    {
      "filename": "AppIcon-60x60@2x.png",
      "idiom": "iphone",
      "scale": "2x",
      "size": "60x60"
    },
    {
      "filename": "AppIcon-60x60@3x.png",
      "idiom": "iphone",
      "scale": "3x",
      "size": "60x60"
    },
    {
      "filename": "AppIcon-1024x1024.png",
      "idiom": "ios-marketing",
      "scale": "1x",
      "size": "1024x1024"
    }
  ],
  "info": {
    "author": "xcode",
    "version": 1
  }
};

fs.writeFileSync(
  path.join(targetDir, 'Contents.json'),
  JSON.stringify(contentsJson, null, 2)
);

console.log('✓ Generated Contents.json');
console.log('✅ iOS app icons generated successfully!');
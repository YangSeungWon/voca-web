const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Android icon sizes
const iconSizes = [
  { size: 48, folder: 'mipmap-mdpi' },
  { size: 72, folder: 'mipmap-hdpi' },
  { size: 96, folder: 'mipmap-xhdpi' },
  { size: 144, folder: 'mipmap-xxhdpi' },
  { size: 192, folder: 'mipmap-xxxhdpi' }
];

// Adaptive icon sizes (foreground and background)
const adaptiveIconSizes = [
  { size: 108, folder: 'mipmap-ldpi' },
  { size: 162, folder: 'mipmap-mdpi' },
  { size: 216, folder: 'mipmap-hdpi' },
  { size: 324, folder: 'mipmap-xhdpi' },
  { size: 432, folder: 'mipmap-xxhdpi' },
  { size: 576, folder: 'mipmap-xxxhdpi' }
];

const projectRoot = path.join(__dirname, '..');
const sourcePath = path.join(projectRoot, 'voca.png');
const androidResPath = path.join(projectRoot, 'android/app/src/main/res');

// Check if source file exists
if (!fs.existsSync(sourcePath)) {
  console.error('Error: voca.png not found in project root');
  process.exit(1);
}

console.log('🤖 Generating Android app icons...\n');

// Generate regular launcher icons
iconSizes.forEach(icon => {
  const outputDir = path.join(androidResPath, icon.folder);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'ic_launcher.png');
  const outputPathRound = path.join(outputDir, 'ic_launcher_round.png');

  try {
    // Generate square icon
    execSync(`sips -z ${icon.size} ${icon.size} "${sourcePath}" --out "${outputPath}"`, {
      stdio: 'pipe'
    });

    // Copy same for round icon (you can make it circular if needed)
    execSync(`sips -z ${icon.size} ${icon.size} "${sourcePath}" --out "${outputPathRound}"`, {
      stdio: 'pipe'
    });

    console.log(`✓ Generated ${icon.folder}/ic_launcher.png (${icon.size}x${icon.size})`);
    console.log(`✓ Generated ${icon.folder}/ic_launcher_round.png (${icon.size}x${icon.size})`);
  } catch (error) {
    console.error(`Failed to generate ${icon.folder} icons:`, error.message);
  }
});

console.log('\n🎨 Generating adaptive icons...\n');

// Generate adaptive icon foreground and background
adaptiveIconSizes.forEach(icon => {
  const outputDir = path.join(androidResPath, icon.folder);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const foregroundPath = path.join(outputDir, 'ic_launcher_foreground.png');
  const backgroundPath = path.join(outputDir, 'ic_launcher_background.png');

  try {
    // Generate foreground (scaled down to fit in safe zone - 72% of full size)
    const foregroundSize = Math.round(icon.size * 0.72);

    // First resize to foreground size
    const tempPath = path.join(outputDir, 'temp_foreground.png');
    execSync(`sips -z ${foregroundSize} ${foregroundSize} "${sourcePath}" --out "${tempPath}"`, {
      stdio: 'pipe'
    });

    // Then pad to full size with transparency (centered)
    const padding = Math.round((icon.size - foregroundSize) / 2);
    execSync(`sips --padToHeightWidth ${icon.size} ${icon.size} "${tempPath}" --out "${foregroundPath}"`, {
      stdio: 'pipe'
    });

    // Remove temp file
    fs.unlinkSync(tempPath);

    // Generate background (solid color - using white)
    // Create a white background using sips
    execSync(`sips -z ${icon.size} ${icon.size} "${sourcePath}" --out "${backgroundPath}"`, {
      stdio: 'pipe'
    });

    // Make it white (you might need to adjust this based on your needs)
    // For now, we'll use the same image as a placeholder

    console.log(`✓ Generated ${icon.folder}/ic_launcher_foreground.png (${icon.size}x${icon.size})`);
    console.log(`✓ Generated ${icon.folder}/ic_launcher_background.png (${icon.size}x${icon.size})`);
  } catch (error) {
    console.error(`Failed to generate ${icon.folder} adaptive icons:`, error.message);
  }
});

// Create/Update adaptive icon XML files
const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>`;

const anydpiDir = path.join(androidResPath, 'mipmap-anydpi-v26');
if (!fs.existsSync(anydpiDir)) {
  fs.mkdirSync(anydpiDir, { recursive: true });
}

fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveIconXml);
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveIconXml);

console.log('\n✓ Created adaptive icon XML configurations');

// Create notification icon (monochrome, smaller size)
const notificationSizes = [
  { size: 24, folder: 'drawable-mdpi' },
  { size: 36, folder: 'drawable-hdpi' },
  { size: 48, folder: 'drawable-xhdpi' },
  { size: 72, folder: 'drawable-xxhdpi' },
  { size: 96, folder: 'drawable-xxxhdpi' }
];

console.log('\n🔔 Generating notification icons...\n');

notificationSizes.forEach(icon => {
  const outputDir = path.join(androidResPath, icon.folder);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'ic_notification.png');

  try {
    execSync(`sips -z ${icon.size} ${icon.size} "${sourcePath}" --out "${outputPath}"`, {
      stdio: 'pipe'
    });
    console.log(`✓ Generated ${icon.folder}/ic_notification.png (${icon.size}x${icon.size})`);
  } catch (error) {
    console.error(`Failed to generate ${icon.folder} notification icon:`, error.message);
  }
});

console.log('\n✅ Android app icons generated successfully!');
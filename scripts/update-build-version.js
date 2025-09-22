const fs = require('fs');
const path = require('path');

// Get the script directory and project root
const scriptDir = __dirname;
const projectRoot = path.join(scriptDir, '..');

// Function to update version in a file
function updateVersion(filePath, versionKey, currentVersionPattern) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(currentVersionPattern);

  if (match) {
    const currentVersion = parseInt(match[1]);
    const newVersion = currentVersion + 1;

    const newContent = content.replace(
      currentVersionPattern,
      (match) => match.replace(currentVersion.toString(), newVersion.toString())
    );

    fs.writeFileSync(filePath, newContent, 'utf8');
    return { current: currentVersion, new: newVersion };
  }

  return null;
}

// Function to sync version across platforms
function syncBuildVersions() {
  console.log('📱 Updating build versions...\n');

  // Read current versions
  const iosProjectPath = path.join(projectRoot, 'ios/App/App.xcodeproj/project.pbxproj');
  const androidGradlePath = path.join(projectRoot, 'android/app/build.gradle');

  // Get current iOS version
  const iosContent = fs.readFileSync(iosProjectPath, 'utf8');
  const iosVersionMatch = iosContent.match(/CURRENT_PROJECT_VERSION = (\d+);/);
  const currentIosVersion = iosVersionMatch ? parseInt(iosVersionMatch[1]) : 1;

  // Get current Android version
  const androidContent = fs.readFileSync(androidGradlePath, 'utf8');
  const androidVersionMatch = androidContent.match(/versionCode (\d+)/);
  const currentAndroidVersion = androidVersionMatch ? parseInt(androidVersionMatch[1]) : 1;

  // Determine the new version (use the maximum of both + 1)
  const maxVersion = Math.max(currentIosVersion, currentAndroidVersion);
  const newVersion = maxVersion + 1;

  console.log(`Current iOS build number: ${currentIosVersion}`);
  console.log(`Current Android version code: ${currentAndroidVersion}`);
  console.log(`New build number: ${newVersion}\n`);

  // Update iOS version
  const newIosContent = iosContent.replace(
    /CURRENT_PROJECT_VERSION = \d+;/g,
    `CURRENT_PROJECT_VERSION = ${newVersion};`
  );
  fs.writeFileSync(iosProjectPath, newIosContent, 'utf8');
  console.log(`✅ Updated iOS build number to ${newVersion}`);

  // Update Android version
  const newAndroidContent = androidContent.replace(
    /versionCode \d+/,
    `versionCode ${newVersion}`
  );
  fs.writeFileSync(androidGradlePath, newAndroidContent, 'utf8');
  console.log(`✅ Updated Android version code to ${newVersion}`);

  // Also update version name if needed (optional)
  const marketingVersionMatch = iosContent.match(/MARKETING_VERSION = ([\d.]+);/);
  if (marketingVersionMatch) {
    const marketingVersion = marketingVersionMatch[1];
    const newAndroidContentWithName = newAndroidContent.replace(
      /versionName "[\d.]+"/,
      `versionName "${marketingVersion}"`
    );
    fs.writeFileSync(androidGradlePath, newAndroidContentWithName, 'utf8');
    console.log(`✅ Updated Android version name to ${marketingVersion}`);
  }

  console.log('\n🎉 Build versions synchronized successfully!');
  return newVersion;
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log('Usage: node update-build-version.js [options]');
    console.log('Options:');
    console.log('  --help    Show this help message');
    console.log('  --check   Show current versions without updating');
    process.exit(0);
  }

  if (args.includes('--check')) {
    // Just check versions without updating
    const iosProjectPath = path.join(projectRoot, 'ios/App/App.xcodeproj/project.pbxproj');
    const androidGradlePath = path.join(projectRoot, 'android/app/build.gradle');

    const iosContent = fs.readFileSync(iosProjectPath, 'utf8');
    const iosVersionMatch = iosContent.match(/CURRENT_PROJECT_VERSION = (\d+);/);
    const currentIosVersion = iosVersionMatch ? parseInt(iosVersionMatch[1]) : 1;

    const androidContent = fs.readFileSync(androidGradlePath, 'utf8');
    const androidVersionMatch = androidContent.match(/versionCode (\d+)/);
    const currentAndroidVersion = androidVersionMatch ? parseInt(androidVersionMatch[1]) : 1;

    console.log('Current build versions:');
    console.log(`  iOS: ${currentIosVersion}`);
    console.log(`  Android: ${currentAndroidVersion}`);
    process.exit(0);
  }

  syncBuildVersions();
}

module.exports = { syncBuildVersions };
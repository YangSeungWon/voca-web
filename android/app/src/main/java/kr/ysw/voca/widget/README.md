# Android Widget Setup Instructions

## Files Created

위젯 파일들이 이미 생성되어 있습니다:

### Kotlin Code
- `TodayWordWidget.kt` - Widget provider implementation

### Layout & Resources
- `res/layout/widget_today_word.xml` - Widget layout
- `res/drawable/widget_background.xml` - Gradient background
- `res/drawable/level_badge_background.xml` - Level badge style
- `res/drawable/pos_background.xml` - Part of speech tag style
- `res/xml/widget_today_word_info.xml` - Widget configuration

### Configuration
- `AndroidManifest.xml` - Widget receiver registered
- `res/values/strings.xml` - Widget description added

## Setup Required

1. **Open Android Studio**
   ```bash
   npx cap open android
   ```

2. **Update API Endpoint**
   - Open `TodayWordWidget.kt`
   - Find line 48: `private const val API_URL`
   - Replace `https://yourdomain.com` with your actual domain

3. **Add Dependencies (if needed)**

   If kotlinx.coroutines is not in your project, add to `app/build.gradle`:
   ```gradle
   dependencies {
       implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
   }
   ```

4. **Build and Run**
   - Sync Gradle
   - Build the project
   - Run on device or emulator

## Widget Features

- 📚 **Today's Word**: Random word updated daily
- 🔄 **Auto-update**: Refreshes every 12 hours
- 🎨 **Dark Theme**: Gradient background (#232931 → #404961)
- 📊 **Level Badge**: Shows word difficulty (Lv.1-5)
- 🔤 **IPA Pronunciation**: Blue colored phonetic notation
- 📝 **Word Meaning**: Up to 3 lines
- 🏷️ **Part of Speech**: noun, verb, etc.
- 👆 **Tap to Open**: Opens main app when clicked

## Adding Widget to Home Screen

1. Long press on home screen
2. Tap "Widgets"
3. Find "Voca Web"
4. Drag "Today's Word" widget to home screen
5. Choose size and placement

## Widget Sizes

- **Minimum**: 180dp × 110dp
- **Resize**: Horizontal and vertical resizing supported
- **Recommended**: 2×2 or 3×2 grid cells

## Troubleshooting

### Widget not updating
- Check API endpoint URL
- Verify internet permission in AndroidManifest.xml
- Check widget update interval (12 hours)

### Widget shows "Loading..."
- API might be unreachable
- Check network security config
- Verify user authentication header

### Build errors
- Make sure kotlinx.coroutines dependency is added
- Sync Gradle files
- Clean and rebuild project

## Network Security

The widget requires internet access to fetch word data.
Ensure your `network_security_config.xml` allows your API domain.

## API Integration

Widget calls:
- Endpoint: `/api/widget/today-word`
- Method: GET
- Header: `x-user-id: default-user`
- Response: JSON with word data

See backend API documentation for details.

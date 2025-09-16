# Voca Web Chrome Extension

Chrome extension for adding words to your Voca Web vocabulary directly from any web page or PDF.

## Features

- **Right-click to Add**: Select any text and right-click to add it to your vocabulary
- **Quick Add Button**: Hover tooltip appears when selecting a word
- **Keyboard Shortcut**: Press `Alt+V` to quickly add selected word
- **Popup Interface**: View stats, recent words, and quickly add words
- **Authentication**: Secure login with your Voca Web account
- **Real-time Stats**: See your vocabulary count in the extension badge

## Installation

1. Make sure Voca Web is running locally:
   ```bash
   npm run dev
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the `chrome-extension` folder

5. The extension icon will appear in your toolbar

## Usage

### First Time Setup

1. Click the extension icon in your toolbar
2. Login with your Voca Web username and password
3. You're ready to start adding words!

### Adding Words

**Method 1: Right-click**
- Select a word on any webpage
- Right-click and choose "Add to Voca Web"

**Method 2: Tooltip**
- Select or double-click a word
- Click the "Add to Voca Web" button in the tooltip

**Method 3: Keyboard shortcut**
- Select a word
- Press `Alt+V`

**Method 4: Popup**
- Click the extension icon
- Type a word in the quick add field
- Click "Add to Vocabulary"

### Features

- **Badge Counter**: Shows total words in your vocabulary
- **Recent Words**: View recently added words in the popup
- **Statistics**: See total words and today's additions
- **Quick Access**: Click "Open App" to launch Voca Web

## Permissions

The extension requires:
- **activeTab**: To read selected text
- **contextMenus**: For right-click functionality
- **storage**: To save authentication token
- **host_permissions**: To communicate with Voca Web API

## Development

To modify the extension:

1. Edit files in the `chrome-extension` directory
2. Click the refresh icon in `chrome://extensions/`
3. Test your changes

## Troubleshooting

- **Not Connected**: Make sure Voca Web is running on localhost:3000
- **Login Failed**: Verify your username and password
- **Words Not Adding**: Check that you're logged in
- **No Tooltip**: Refresh the page after installing the extension
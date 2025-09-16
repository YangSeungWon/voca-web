// API configuration
const API_URL = 'http://localhost:3000';
let authToken = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for text selection
  chrome.contextMenus.create({
    id: 'add-to-vocabulary',
    title: 'Add "%s" to Voca Web',
    contexts: ['selection']
  });

  // Load saved auth token
  chrome.storage.local.get(['authToken'], (result) => {
    if (result.authToken) {
      authToken = result.authToken;
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'add-to-vocabulary' && info.selectionText) {
    const word = info.selectionText.trim().toLowerCase();
    
    if (!authToken) {
      // Show notification to login
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon-48.png',
        title: 'Login Required',
        message: 'Please login to Voca Web to add words to your vocabulary.'
      });
      return;
    }

    try {
      // Add word to vocabulary
      const response = await addWordToVocabulary(word);
      
      if (response.success) {
        // Show success notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icons/icon-48.png',
          title: 'Word Added',
          message: `"${word}" has been added to your vocabulary!`
        });

        // Update badge
        updateBadge();
      } else {
        throw new Error(response.error || 'Failed to add word');
      }
    } catch (error) {
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon-48.png',
        title: 'Error',
        message: error.message || 'Failed to add word to vocabulary'
      });
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'login') {
    handleLogin(request.username, request.password)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'logout') {
    handleLogout();
    sendResponse({ success: true });
  }
  
  if (request.action === 'checkAuth') {
    sendResponse({ isAuthenticated: !!authToken, token: authToken });
  }
  
  if (request.action === 'addWord') {
    if (!authToken) {
      sendResponse({ success: false, error: 'Not authenticated' });
      return;
    }
    
    addWordToVocabulary(request.word)
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'getStats') {
    if (!authToken) {
      sendResponse({ success: false, error: 'Not authenticated' });
      return;
    }
    
    getVocabularyStats()
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getRecentWords') {
    if (!authToken) {
      sendResponse({ success: false, error: 'Not authenticated' });
      return;
    }
    
    getRecentWords()
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Login handler
async function handleLogin(username, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      authToken = data.token;
      
      // Save token to storage
      await chrome.storage.local.set({ 
        authToken: authToken,
        userId: data.userId,
        username: username 
      });
      
      // Update badge
      updateBadge();
      
      return { 
        success: true, 
        userId: data.userId,
        username: username 
      };
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Logout handler
function handleLogout() {
  authToken = null;
  chrome.storage.local.remove(['authToken', 'userId', 'username']);
  chrome.action.setBadgeText({ text: '' });
}

// Add word to vocabulary
async function addWordToVocabulary(word) {
  try {
    // First, check if word exists in dictionary
    const dictResponse = await fetch(`${API_URL}/api/dictionary/${encodeURIComponent(word)}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!dictResponse.ok) {
      throw new Error('Word not found in dictionary');
    }

    const wordData = await dictResponse.json();

    // Add to user's vocabulary
    const response = await fetch(`${API_URL}/api/vocabulary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        word: word,
        wordData: wordData
      })
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, data: data };
    } else {
      throw new Error(data.error || 'Failed to add word');
    }
  } catch (error) {
    console.error('Error adding word:', error);
    throw error;
  }
}

// Get vocabulary statistics
async function getVocabularyStats() {
  try {
    const response = await fetch(`${API_URL}/api/vocabulary/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get statistics');
    }

    const data = await response.json();
    return { success: true, stats: data };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

// Get recent words
async function getRecentWords() {
  try {
    const response = await fetch(`${API_URL}/api/vocabulary?limit=5&sort=createdAt`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get recent words');
    }

    const data = await response.json();
    return { success: true, words: data };
  } catch (error) {
    console.error('Error getting recent words:', error);
    throw error;
  }
}

// Update extension badge with word count
async function updateBadge() {
  if (!authToken) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  try {
    const stats = await getVocabularyStats();
    if (stats.success && stats.stats.total) {
      chrome.action.setBadgeText({ text: stats.stats.total.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#1f2937' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Check and update badge periodically
setInterval(() => {
  if (authToken) {
    updateBadge();
  }
}, 60000); // Update every minute
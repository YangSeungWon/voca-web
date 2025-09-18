// API configuration
const API_URL = 'https://voca.ysw.kr';
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
        // Get the first definition if available
        let message = `"${word}" has been added to your vocabulary!`;
        if (response.word && response.word.definitions && response.word.definitions.length > 0) {
          const firstDef = response.word.definitions[0];
          message = `${word}: ${firstDef.meaning}`;
          if (firstDef.partOfSpeech) {
            message = `${word} (${firstDef.partOfSpeech}): ${firstDef.meaning}`;
          }
        }
        
        // Show success notification with definition
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icons/icon-48.png',
          title: '✓ Word Added',
          message: message
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
    handleLogin(request.email, request.password)
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
  
  // Sync from web app
  if (request.action === 'syncFromWeb') {
    if (request.token) {
      authToken = request.token;
      chrome.storage.local.set({ 
        authToken: request.token,
        userId: request.userId,
        email: request.email 
      });
      updateBadge();
      sendResponse({ success: true });
    } else {
      // Clear auth if no token (logout)
      authToken = null;
      chrome.storage.local.remove(['authToken', 'userId', 'email']);
      chrome.action.setBadgeText({ text: '' });
      sendResponse({ success: true });
    }
  }
});

// Login handler
async function handleLogin(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      authToken = data.token;
      
      // Save token to storage
      await chrome.storage.local.set({ 
        authToken: authToken,
        userId: data.userId,
        email: email 
      });
      
      // Update badge
      updateBadge();
      
      return { 
        success: true, 
        userId: data.userId,
        email: email 
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
  chrome.storage.local.remove(['authToken', 'userId', 'email']);
  chrome.action.setBadgeText({ text: '' });
}

// Add word to vocabulary
async function addWordToVocabulary(word) {
  try {
    // First get dictionary data
    const dictResponse = await fetch(`${API_URL}/api/dictionary/external?word=${encodeURIComponent(word)}`);
    let wordData = null;
    
    if (dictResponse.ok) {
      wordData = await dictResponse.json();
    }
    
    // Add to user's vocabulary (API will fetch dictionary data if needed)
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
      // Include word data in response
      return { success: true, data: data, word: wordData || { word: word } };
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
    const response = await fetch(`${API_URL}/api/vocabulary`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get statistics');
    }

    const data = await response.json();
    
    // Calculate stats from vocabulary data
    const today = new Date().toDateString();
    const todayAdded = data.filter(item => 
      new Date(item.createdAt).toDateString() === today
    ).length;
    
    return { 
      success: true, 
      stats: {
        total: data.length,
        todayAdded: todayAdded
      }
    };
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
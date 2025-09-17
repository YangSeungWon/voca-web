// Popup script
let currentUser = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication status
  const auth = await checkAuth();
  
  if (auth.isAuthenticated) {
    // Load user data from storage
    const stored = await chrome.storage.local.get(['email']);
    currentUser = stored.email;
    showLoggedInView();
    loadStats();
    loadRecentWords();
  } else {
    showLoginView();
  }
  
  // Setup event listeners
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
  });
  
  // Logout button
  document.getElementById('logout').addEventListener('click', handleLogout);
  
  // Quick add word
  document.getElementById('add-word').addEventListener('click', handleQuickAdd);
  document.getElementById('quick-word').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleQuickAdd();
    }
  });
  
  // Open app links
  document.getElementById('open-app').addEventListener('click', openApp);
  document.getElementById('open-app-logged').addEventListener('click', openApp);
}

// Check authentication
async function checkAuth() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'checkAuth' }, resolve);
  });
}

// Show login view
function showLoginView() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('logged-in-section').classList.add('hidden');
  updateStatus('Not connected', 'error');
}

// Show logged in view
function showLoggedInView() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('logged-in-section').classList.remove('hidden');
  document.getElementById('email-display').textContent = currentUser;
  updateStatus('Connected', 'connected');
}

// Handle login
async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    showMessage('Please enter email and password', 'error');
    return;
  }
  
  showMessage('Logging in...', '');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'login',
      email: email,
      password: password
    });
    
    if (response.success) {
      currentUser = email;
      showLoggedInView();
      loadStats();
      loadRecentWords();
      showMessage('Logged in successfully!', 'success');
      
      // Clear form
      document.getElementById('login-form').reset();
    } else {
      throw new Error(response.error || 'Login failed');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

// Handle logout
function handleLogout() {
  chrome.runtime.sendMessage({ action: 'logout' });
  currentUser = null;
  showLoginView();
  showMessage('Logged out', 'success');
}

// Handle quick add word
async function handleQuickAdd() {
  const input = document.getElementById('quick-word');
  const word = input.value.trim().toLowerCase();
  
  if (!word) {
    showMessage('Please enter a word', 'error');
    return;
  }
  
  showMessage('Adding word...', '');
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'addWord',
      word: word
    });
    
    if (response.success) {
      showMessage(`"${word}" added successfully!`, 'success');
      input.value = '';
      loadStats();
      loadRecentWords();
    } else {
      throw new Error(response.error || 'Failed to add word');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

// Load vocabulary statistics
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    
    if (response.success) {
      const stats = response.stats;
      document.getElementById('total-words').textContent = stats.total || '0';
      document.getElementById('today-added').textContent = stats.todayAdded || '0';
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load recent words
async function loadRecentWords() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getRecentWords' });
    
    if (response.success && response.words.length > 0) {
      const recentSection = document.getElementById('recent-section');
      const recentList = document.getElementById('recent-list');
      
      recentSection.classList.remove('hidden');
      recentList.innerHTML = '';
      
      response.words.slice(0, 5).forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="word">${item.word.word}</span>
          <span class="time">${formatTime(item.createdAt)}</span>
        `;
        recentList.appendChild(li);
      });
    } else {
      document.getElementById('recent-section').classList.add('hidden');
    }
  } catch (error) {
    console.error('Failed to load recent words:', error);
  }
}

// Format time ago
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Update connection status
function updateStatus(text, type) {
  const status = document.getElementById('status');
  const statusText = status.querySelector('.status-text');
  
  statusText.textContent = text;
  status.className = `status ${type}`;
}

// Show message
function showMessage(text, type) {
  const message = document.getElementById('message');
  
  if (!text) {
    message.classList.add('hidden');
    return;
  }
  
  message.textContent = text;
  message.className = `message ${type}`;
  message.classList.remove('hidden');
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      message.classList.add('hidden');
    }, 3000);
  }
}

// Open main app
function openApp() {
  chrome.tabs.create({ url: 'https://voca.ysw.kr' });
}
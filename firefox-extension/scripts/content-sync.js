// Content script to sync authentication between web app and extension
// This runs on voca.ysw.kr pages

(function() {
  // Only run on voca.ysw.kr
  if (!window.location.hostname.includes('voca.ysw.kr')) {
    return;
  }

  // Mark that extension is installed
  document.documentElement.setAttribute('data-voca-web-extension', 'installed');

  // Function to sync auth data
  function syncAuthToExtension() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    
    if (token) {
      // Send to background script
      chrome.runtime.sendMessage({
        action: 'syncFromWeb',
        token: token,
        userId: userId,
        email: email
      });
    }
  }

  // Sync on page load
  syncAuthToExtension();
  
  // Listen for storage changes (login/logout)
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' || e.key === 'userId' || e.key === 'userEmail') {
      syncAuthToExtension();
    }
  });

  // Also sync when the page becomes visible (tab switch back)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncAuthToExtension();
    }
  });
})();
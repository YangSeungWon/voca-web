// Content script for word selection and tooltip
let tooltip = null;
let selectedWord = '';

// Create tooltip element
function createTooltip() {
  const div = document.createElement('div');
  div.className = 'voca-web-tooltip';
  div.innerHTML = `
    <button class="voca-add-btn">Add to Voca Web</button>
    <div class="voca-message"></div>
  `;
  document.body.appendChild(div);
  return div;
}

// Show tooltip at selection
function showTooltip(x, y) {
  if (!tooltip) {
    tooltip = createTooltip();
  }
  
  // Position tooltip
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y - 40}px`;
  tooltip.classList.add('visible');
  
  // Add click handler
  const addBtn = tooltip.querySelector('.voca-add-btn');
  addBtn.onclick = addSelectedWord;
}

// Hide tooltip
function hideTooltip() {
  if (tooltip) {
    tooltip.classList.remove('visible');
  }
}

// Add selected word to vocabulary
async function addSelectedWord() {
  if (!selectedWord) return;
  
  const addBtn = tooltip.querySelector('.voca-add-btn');
  const message = tooltip.querySelector('.voca-message');
  
  addBtn.disabled = true;
  addBtn.textContent = 'Adding...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'addWord',
      word: selectedWord
    });
    
    if (response.success) {
      message.textContent = 'Added successfully!';
      message.className = 'voca-message success';
      addBtn.style.display = 'none';
      
      setTimeout(() => {
        hideTooltip();
        addBtn.style.display = 'block';
        addBtn.disabled = false;
        addBtn.textContent = 'Add to Voca Web';
        message.textContent = '';
        message.className = 'voca-message';
      }, 2000);
    } else {
      throw new Error(response.error || 'Failed to add word');
    }
  } catch (error) {
    message.textContent = error.message;
    message.className = 'voca-message error';
    addBtn.disabled = false;
    addBtn.textContent = 'Try Again';
  }
}

// Handle text selection
document.addEventListener('mouseup', (e) => {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  // Check if clicked on tooltip
  if (tooltip && tooltip.contains(e.target)) {
    return;
  }
  
  if (text && text.split(' ').length === 1 && text.length > 2 && text.length < 30) {
    // Single word selected
    selectedWord = text.toLowerCase();
    
    // Get selection position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    showTooltip(rect.left + rect.width / 2, rect.top + window.scrollY);
  } else {
    // No selection or multiple words
    selectedWord = '';
    hideTooltip();
  }
});

// Hide tooltip on scroll
document.addEventListener('scroll', () => {
  hideTooltip();
});

// Hide tooltip on click outside
document.addEventListener('click', (e) => {
  if (tooltip && !tooltip.contains(e.target)) {
    hideTooltip();
  }
});

// Handle double-click word selection
document.addEventListener('dblclick', (e) => {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (text && text.split(' ').length === 1 && text.length > 2 && text.length < 30) {
    selectedWord = text.toLowerCase();
    
    // Get selection position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    showTooltip(rect.left + rect.width / 2, rect.top + window.scrollY);
  }
});

// Listen for keyboard shortcut (Alt+V)
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'v') {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text && text.split(' ').length === 1) {
      selectedWord = text.toLowerCase();
      
      chrome.runtime.sendMessage({
        action: 'addWord',
        word: selectedWord
      }, response => {
        if (response && response.success) {
          // Show brief success indicator
          const indicator = document.createElement('div');
          indicator.className = 'voca-success-indicator';
          indicator.textContent = `"${selectedWord}" added!`;
          document.body.appendChild(indicator);
          
          setTimeout(() => {
            indicator.remove();
          }, 2000);
        }
      });
    }
  }
});

// Check authentication status on load
chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
  if (!response.isAuthenticated) {
    console.log('Voca Web: Please login to use the extension');
  }
});
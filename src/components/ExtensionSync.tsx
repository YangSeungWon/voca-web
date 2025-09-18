'use client';

import { useEffect } from 'react';

export default function ExtensionSync() {
  useEffect(() => {
    // Check if extension is installed
    const extensionId = 'ajflgkmapedegaokdcmpdepepmchfbeo';
    
    // Send auth info to extension when logged in
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    
    if (token && chrome?.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage(extensionId, {
          action: 'syncAuth',
          token,
          userId,
          email
        }, (response) => {
          if (chrome.runtime.lastError) {
            // Extension not installed or not responding
            console.log('Extension not available');
          } else {
            console.log('Synced with extension');
          }
        });
      } catch (error) {
        // Chrome API not available (non-Chrome browser)
        console.log('Chrome API not available');
      }
    }
  }, []);
  
  return null;
}
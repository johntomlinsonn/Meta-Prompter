// Background script for Chrome extension
// This script runs in the background as a service worker

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Initialize storage with default values
  chrome.storage.sync.set({ 
    settings: {
      enabled: true,
      theme: 'light'
    } 
  }, () => {
    console.log('Default settings saved');
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message);
  
  // Handle different message types
  if (message.type === 'getData') {
    chrome.storage.sync.get('settings', (data) => {
      sendResponse(data);
    });
    return true; // Required for async response
  }
});

// Add any additional background functionality here

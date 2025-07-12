// Popup script

// DOM elements
const enableToggle = document.getElementById('enableToggle');
const statusText = document.getElementById('statusText');
const themeSelect = document.getElementById('themeSelect');
const actionButton = document.getElementById('actionButton');
const optionsButton = document.getElementById('optionsButton');

// Initialize popup
function initializePopup() {
  console.log('Popup initialized');
  
  // Load settings from storage
  chrome.storage.sync.get('settings', (data) => {
    if (data.settings) {
      // Update UI based on stored settings
      enableToggle.checked = data.settings.enabled;
      statusText.textContent = data.settings.enabled ? 'Enabled' : 'Disabled';
      themeSelect.value = data.settings.theme;
    }
  });
  
  // Set up event listeners
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
  // Toggle extension enabled/disabled
  enableToggle.addEventListener('change', () => {
    const isEnabled = enableToggle.checked;
    statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
    
    // Save to storage
    chrome.storage.sync.get('settings', (data) => {
      const settings = data.settings || {};
      settings.enabled = isEnabled;
      
      chrome.storage.sync.set({ settings }, () => {
        console.log('Settings updated:', settings);
      });
    });
  });
  
  // Theme selection
  themeSelect.addEventListener('change', () => {
    const selectedTheme = themeSelect.value;
    
    // Save to storage
    chrome.storage.sync.get('settings', (data) => {
      const settings = data.settings || {};
      settings.theme = selectedTheme;
      
      chrome.storage.sync.set({ settings }, () => {
        console.log('Theme updated:', selectedTheme);
      });
    });
  });
  
  // Action button
  actionButton.addEventListener('click', () => {
    console.log('Action button clicked');
    
    // Send message to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'performAction' });
      }
    });
  });
  
  // Options button
  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', initializePopup);

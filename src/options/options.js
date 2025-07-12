// Options page script

// DOM elements
const enableExtension = document.getElementById('enableExtension');
const themeSelect = document.getElementById('themeSelect');
const notificationsEnabled = document.getElementById('notificationsEnabled');
const updateInterval = document.getElementById('updateInterval');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');

// Default settings
const defaultSettings = {
  enabled: true,
  theme: 'light',
  notifications: false,
  updateInterval: 15
};

// Initialize options page
function initializeOptions() {
  console.log('Options page initialized');
  
  // Load current settings
  loadSettings();
  
  // Set up event listeners
  setupEventListeners();
}

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get('settings', (data) => {
    const settings = data.settings || defaultSettings;
    
    // Update UI with loaded settings
    enableExtension.checked = settings.enabled;
    themeSelect.value = settings.theme || 'light';
    notificationsEnabled.checked = settings.notifications || false;
    updateInterval.value = settings.updateInterval || 15;
    
    console.log('Settings loaded:', settings);
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    enabled: enableExtension.checked,
    theme: themeSelect.value,
    notifications: notificationsEnabled.checked,
    updateInterval: parseInt(updateInterval.value, 10)
  };
  
  chrome.storage.sync.set({ settings }, () => {
    console.log('Settings saved:', settings);
    
    // Show save confirmation
    showSaveConfirmation();
  });
}

// Reset settings to defaults
function resetSettings() {
  // Reset UI
  enableExtension.checked = defaultSettings.enabled;
  themeSelect.value = defaultSettings.theme;
  notificationsEnabled.checked = defaultSettings.notifications;
  updateInterval.value = defaultSettings.updateInterval;
  
  // Save default settings
  saveSettings();
}

// Show save confirmation
function showSaveConfirmation() {
  // Create a notification element
  const notification = document.createElement('div');
  notification.textContent = 'Settings saved successfully!';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4caf50;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    z-index: 9999;
  `;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Set up event listeners
function setupEventListeners() {
  // Save button
  saveButton.addEventListener('click', saveSettings);
  
  // Reset button
  resetButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to their default values?')) {
      resetSettings();
    }
  });
  
  // Input validation for update interval
  updateInterval.addEventListener('input', () => {
    const value = parseInt(updateInterval.value, 10);
    if (isNaN(value) || value < 1) {
      updateInterval.value = 1;
    } else if (value > 60) {
      updateInterval.value = 60;
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptions);

// Content script
// This runs on web pages that match the patterns in the manifest

// Function to initialize the content script
function initializeContentScript() {
  console.log('Content script initialized');
  
  // Request settings from background script
  chrome.runtime.sendMessage({ type: 'getData' }, (response) => {
    if (response && response.settings) {
      console.log('Received settings:', response.settings);
      
      // Apply settings or perform actions based on settings
      if (response.settings.enabled) {
        // Extension functionality is enabled
        setupPageInteraction();
      }
    }
  });
}

// Setup page interaction functionality
function setupPageInteraction() {
  // Add your page interaction code here
  // For example, you might want to modify page content,
  // add event listeners, or extract information
  
  console.log('Page interaction set up');
  
  // Example: Add a class to the body element
  document.body.classList.add('chrome-extension-active');
}

// Initialize when the content script loads
initializeContentScript();

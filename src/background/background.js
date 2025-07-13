// Background script for Chrome extension
// This script runs in the background as a service worker

import Cerebras from '@cerebras/cerebras_cloud_sdk';

let storedApiKey = null;

// Load API key from storage on startup
chrome.storage.local.get('apiKey', (result) => {
  if (result.apiKey) {
    storedApiKey = result.apiKey;
  }
});

// Keep track of which inputs are active across tabs
let activeInputs = {};

async function getMetaPrompt(userPrompt) {
  // Read metaprompt.txt and replace {USER_PROMPT}
  const response = await fetch(chrome.runtime.getURL('metaprompt.txt'));
  let metaPrompt = await response.text();
  metaPrompt = metaPrompt.replace(/`\{USER_PROMPT\}`/g, userPrompt);
  return metaPrompt;
}

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Initialize storage with default values
  chrome.storage.sync.set({ 
    settings: {
      enabled: true,
      theme: 'light',
      enhancementLevel: 'moderate', // Controls how aggressively prompts are enhanced
      autoApply: false // Whether to auto-apply suggestions or just show them
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
  
  // Handle when an input is focused
  else if (message.type === 'inputFocused') {
    const tabId = sender.tab.id;
    activeInputs[tabId] = message.data;
    console.log(`Input focused in tab ${tabId}:`, message.data);
    
    // Update the extension icon to show it's active on this page
    updateExtensionIcon(true);
  }
  
  // Handle when an input is blurred (loses focus)
  else if (message.type === 'inputBlurred') {
    const tabId = sender.tab.id;
    delete activeInputs[tabId];
    console.log(`Input blurred in tab ${tabId}`);
    
    // If no active inputs, update the icon to show inactive state
    if (Object.keys(activeInputs).length === 0) {
      updateExtensionIcon(false);
    }
  }

  if (message.type === 'metaPrompt') {
   
    (async () => {
      try {
        // If storedApiKey is null, try to load it from storage
        if (!storedApiKey) {
          chrome.storage.local.get('apiKey', async (result) => {
            if (result.apiKey) {
              storedApiKey = result.apiKey;
              const client = new Cerebras({ apiKey: storedApiKey });
              const metaPrompt = await getMetaPrompt(message.text);
              const completionCreateResponse = await client.chat.completions.create({
                messages: [{ role: 'user', content: metaPrompt }],
                model: 'llama3.1-8b',
              });
              console.log('Cerebras AI response:', completionCreateResponse);
              sendResponse({ result: completionCreateResponse });
            } else {
              sendResponse({ error: 'API key not set.' });
            }
          });
          return;
        }
        const client = new Cerebras({ apiKey: storedApiKey });
        const metaPrompt = await getMetaPrompt(message.text);
        const completionCreateResponse = await client.chat.completions.create({
          messages: [{ role: 'user', content: metaPrompt }],
          model: 'llama3.1-8b',
        });
        console.log('Cerebras AI response:', completionCreateResponse);
        sendResponse({ result: completionCreateResponse });
      } catch (error) {
        console.error('Cerebras API error:', error);
        sendResponse({ error: error.message });
      }
    })();
    return true; // Indicates async response
  }

  if (message.action === 'saveApiKey') {
    storedApiKey = message.apiKey;
    chrome.storage.local.set({ apiKey: storedApiKey });
    sendResponse({ success: true });
  }
  if (message.action === 'getApiKey') {
    sendResponse({ apiKey: storedApiKey });
  }
});

// Function to update the extension icon
function updateExtensionIcon(active) {
  // You can change the icon based on whether the extension is actively tracking an input
  /* 
  // This would require proper icon files to be added to your assets folder
  chrome.action.setIcon({
    path: active 
      ? {
          16: "src/assets/icons/icon16-active.png",
          48: "src/assets/icons/icon48-active.png",
          128: "src/assets/icons/icon128-active.png"
        }
      : {
          16: "src/assets/icons/icon16.png",
          48: "src/assets/icons/icon48.png",
          128: "src/assets/icons/icon128.png"
        }
  });
  */
  
  // You can also update the badge to show the active state
  chrome.action.setBadgeText({
    text: active ? 'ON' : ''
  });
  
  chrome.action.setBadgeBackgroundColor({
    color: active ? '#4CAF50' : '#CCCCCC'
  });
}

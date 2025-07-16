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

  if (message.type === 'metaPrompt') {
   
    (async () => {
      try {
        // If storedApiKey is null, try to load it from storage
        if (!storedApiKey) {
          chrome.storage.local.get('apiKey', async (result) => {

            if (result.apiKey) {
              storedApiKey = result.apiKey;
              try {
                const client = new Cerebras({ apiKey: storedApiKey });
                const metaPrompt = await getMetaPrompt(message.prompt);
                const completionCreateResponse = await client.chat.completions.create({
                  messages: [{ role: 'user', content: metaPrompt }],
                  model: 'llama-4-scout-17b-16e-instruct',
                });
                console.log('Cerebras AI response:', completionCreateResponse);
                sendResponse({ result: completionCreateResponse });
              } catch (error) {
                console.error('Cerebras API error:', error);
                // Provide specific error types for better error handling
                if (error.message.includes('API key') || error.message.includes('authentication')) {
                  sendResponse({ error: 'NO_API_KEY' });
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                  sendResponse({ error: 'NO_INTERNET' });
                } else if (error.message.includes('rate limit') || error.message.includes('429')) {
                  sendResponse({ error: 'RATE_LIMIT' });
                } else {
                  sendResponse({ error: 'INVALID_RESPONSE' });
                }
              }
            } else {
              sendResponse({ error: 'NO_API_KEY' });
            }
          });
          return;
        }
        const client = new Cerebras({ apiKey: storedApiKey });
        const metaPrompt = await getMetaPrompt(message.prompt);
        const completionCreateResponse = await client.chat.completions.create({
          messages: [{ role: 'user', content: metaPrompt }],
          model: 'llama-4-scout-17b-16e-instruct',
        });
        console.log('Cerebras AI response:', completionCreateResponse);
        sendResponse({ result: completionCreateResponse });
      } catch (error) {
        console.error('Cerebras API error:', error);
        // Provide specific error types for better error handling
        if (error.message.includes('API key') || error.message.includes('authentication')) {
          sendResponse({ error: 'NO_API_KEY' });
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          sendResponse({ error: 'NO_INTERNET' });
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          sendResponse({ error: 'RATE_LIMIT' });
        } else {
          sendResponse({ error: 'INVALID_RESPONSE' });
        }
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

  // New: Generate improvement questions for a prompt
  if (message.type === 'generatePromptQuestions') {
    (async () => {
      try {
        if (!storedApiKey) {
          chrome.storage.local.get('apiKey', async (result) => {
            if (result.apiKey) {
              storedApiKey = result.apiKey;
              try {
                const client = new Cerebras({ apiKey: storedApiKey });
                const systemPrompt = `You are a prompt improvement assistant. Given a user prompt, generate 3-5 clarifying questions that would help you improve the prompt. Return ONLY a JSON array of questions, e.g. ["What is your intended audience?", "What is the desired tone?", ...]`;
                const completion = await client.chat.completions.create({
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message.prompt }
                  ],
                  model: 'llama-4-scout-17b-16e-instruct',
                });
                const text = completion.choices[0].message.content;
                let questions = [];
                try {
                  questions = JSON.parse(text);
                } catch (e) {
                  // fallback: try to extract JSON array
                  const match = text.match(/\[.*\]/s);
                  if (match) questions = JSON.parse(match[0]);
                }
                sendResponse({ questions });
              } catch (error) {
                console.error('Cerebras API error:', error);
                if (error.message.includes('API key') || error.message.includes('authentication')) {
                  sendResponse({ error: 'NO_API_KEY' });
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                  sendResponse({ error: 'NO_INTERNET' });
                } else if (error.message.includes('rate limit') || error.message.includes('429')) {
                  sendResponse({ error: 'RATE_LIMIT' });
                } else {
                  sendResponse({ error: 'INVALID_RESPONSE' });
                }
              }
            } else {
              sendResponse({ error: 'NO_API_KEY' });
            }
          });
          return;
        }
        const client = new Cerebras({ apiKey: storedApiKey });
        const systemPrompt = `You are a prompt improvement assistant. Given a user prompt, generate 3-5 clarifying questions that would help you improve the prompt. Return ONLY a JSON array of questions, e.g. ["What is your intended audience?", "What is the desired tone?", ...]`;
        const completion = await client.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message.prompt }
          ],
          model: 'llama-4-scout-17b-16e-instruct',
        });
        const text = completion.choices[0].message.content;
        let questions = [];
        try {
          questions = JSON.parse(text);
        } catch (e) {
          // fallback: try to extract JSON array
          const match = text.match(/\[.*\]/s);
          if (match) questions = JSON.parse(match[0]);
        }
        sendResponse({ questions });
      } catch (error) {
        console.error('Cerebras API error:', error);
        if (error.message.includes('API key') || error.message.includes('authentication')) {
          sendResponse({ error: 'NO_API_KEY' });
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          sendResponse({ error: 'NO_INTERNET' });
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          sendResponse({ error: 'RATE_LIMIT' });
        } else {
          sendResponse({ error: 'INVALID_RESPONSE' });
        }
      }
    })();
    return true;
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

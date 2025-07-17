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


async function getMetaPrompt(userPrompt) {
  const response = await fetch(chrome.runtime.getURL('prompt-classification/metaprompt.txt'));
  let metaPrompt = await response.text();
  metaPrompt = metaPrompt.replace(/`\{USER_PROMPT\}`/g, userPrompt);
  return metaPrompt;
}

async function getAIResponse(prompt) {
  if (!storedApiKey) {
    throw new Error('NO_API_KEY');
  }

  const client = new Cerebras({ apiKey: storedApiKey });
  const metaPrompt = await getMetaPrompt(prompt);
  const completionCreateResponse = await client.chat.completions.create({
    messages: [{ role: 'user', content: metaPrompt }],
    model: 'llama-4-scout-17b-16e-instruct',
  });

  return completionCreateResponse;
}

function handleError(error, sendResponse) {
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

async function getQuestions(prompt) {
  if (!storedApiKey) {
    throw new Error('NO_API_KEY');
  }

  const client = new Cerebras({ apiKey: storedApiKey });
  const systemPrompt = `You are a prompt improvement assistant. Given a user prompt, generate 3-5 clarifying questions that would help you improve the prompt. Return ONLY a JSON array of questions, e.g. ["What is your intended audience?", "What is the desired tone?", ...]`;
  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
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
  
  return questions;
}

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Initialize storage with default enhancement level
  chrome.storage.sync.get(['enhancementLevel'], (result) => {
    if (!result.enhancementLevel) {
      chrome.storage.sync.set({ enhancementLevel: 'moderate' }, () => {
        console.log('Default enhancement level saved');
      });
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  
  // Handle different message types
  if (message.type === 'getData') {
    chrome.storage.sync.get(['enhancementLevel'], (data) => {
      sendResponse(data);
    });
    return true; 
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
                const completionCreateResponse = await getAIResponse(message.prompt);
                sendResponse({ result: completionCreateResponse });
              } catch (error) {
                console.error('Cerebras API error:', error);
                handleError(error, sendResponse);
              }
            } else {
              sendResponse({ error: 'NO_API_KEY' });
            }
          });
          return;
        }
        
        const completionCreateResponse = await getAIResponse(message.prompt);
        sendResponse({ result: completionCreateResponse });
      } catch (error) {
        handleError(error, sendResponse);
      }
    })();
    return true; 
  }

  if (message.action === 'saveApiKey') {
    storedApiKey = message.apiKey;
    chrome.storage.local.set({ apiKey: storedApiKey });
    sendResponse({ success: true });
  }
  if (message.action === 'getApiKey') {
    sendResponse({ apiKey: storedApiKey });
  }

 
  if (message.type === 'generatePromptQuestions') {
    (async () => {
      try {
        if (!storedApiKey) {
          chrome.storage.local.get('apiKey', async (result) => {
            if (result.apiKey) {
              storedApiKey = result.apiKey;
              try {
                const questions = await getQuestions(message.prompt);
                sendResponse({ questions });
              } catch (error) {
                handleError(error, sendResponse);
              }
            } else {
              sendResponse({ error: 'NO_API_KEY' });
            }
          });
          return;
        }
        
        const questions = await getQuestions(message.prompt);
        sendResponse({ questions });
      } catch (error) {
        handleError(error, sendResponse);
      }
    })();
    return true;
  }
});


// Utility functions for the Chrome extension

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @return {Function} - The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Format a timestamp into a readable date string
 * @param {number} timestamp - The timestamp to format
 * @return {string} - Formatted date string
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Generate a random ID
 * @param {number} length - The length of the ID
 * @return {string} - Random ID
 */
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @return {any} - Parsed object or fallback
 */
export function safeJsonParse(jsonString, fallback = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

/**
 * Check if an object is empty
 * @param {Object} obj - The object to check
 * @return {boolean} - True if empty
 */
export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Get the current active tab
 * @return {Promise<chrome.tabs.Tab>} - Promise resolving to the active tab
 */
export function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

/**
 * Send a message to a specific tab
 * @param {number} tabId - The ID of the tab
 * @param {any} message - The message to send
 * @return {Promise<any>} - Promise resolving to the response
 */
export function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      resolve(response);
    });
  });
}

/**
 * Get storage data
 * @param {string|Array|Object} keys - The keys to get
 * @return {Promise<Object>} - Promise resolving to the data
 */
export function getStorageData(keys) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (data) => {
      resolve(data);
    });
  });
}

/**
 * Set storage data
 * @param {Object} data - The data to set
 * @return {Promise<void>} - Promise resolving when data is set
 */
export function setStorageData(data) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, resolve);
  });
}

export function handleMetaPrompt(text, callback) {
  chrome.runtime.sendMessage(
    { type: 'metaPrompt', text },
    (response) => {
      if (response && response.result) {
        let aiText = '';
        if (response.result.choices && response.result.choices[0] && response.result.choices[0].message && response.result.choices[0].message.content) {
          aiText = response.result.choices[0].message.content;
        } else {
          aiText = JSON.stringify(response.result);
        }
        // Extract JSON block between ```json and ```
        const jsonStart = aiText.indexOf('```json');
        const jsonEnd = aiText.lastIndexOf('```');
        let jsonString = '';
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonString = aiText.substring(jsonStart + 7, jsonEnd).trim();
        } else {
          // fallback: try to find any {...} block
          const match = aiText.match(/\{[\s\S]*\}/);
          jsonString = match ? match[0] : '';
        }
        if (typeof callback === 'function') {
          callback(jsonString);
        }
      } else if (response && response.error) {
        console.error('Cerebras API error:', response.error);
        if (typeof callback === 'function') {
          callback(null, response.error);
        }
      } else {
        console.error('No response from background script.');
        if (typeof callback === 'function') {
          callback(null, 'No response from background script.');
        }
      }
    }
  );
}

import './popup.css';

document.addEventListener('DOMContentLoaded', () => {
  // API Key elements
  const apiKeyInput = document.getElementById('apiKey');
  const deleteApiKeyBtn = document.getElementById('deleteApiKeyBtn');

  // Load saved API key and show masked version if it exists
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (result.apiKey) {
      // Show masked characters for existing API key
      apiKeyInput.value = '●'.repeat(24); // Show 24 masked characters
      apiKeyInput.placeholder = 'API key is saved';
      deleteApiKeyBtn.style.display = 'block'; // Show delete button
    } else {
      apiKeyInput.value = '';
      apiKeyInput.placeholder = 'Enter your API key...';
      deleteApiKeyBtn.style.display = 'none'; // Hide delete button
    }
  });


  // Delete API key functionality
  deleteApiKeyBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete your API key?')) {
      chrome.storage.sync.remove(['apiKey'], () => {
        apiKeyInput.value = '';
        apiKeyInput.placeholder = 'Enter your API key...';
        deleteApiKeyBtn.style.display = 'none';

      });
    }
  });

  // Enhancement level
  const enhancementLevel = document.getElementById('enhancementLevel');
  
  // Load saved enhancement level from Chrome storage
  chrome.storage.sync.get(['enhancementLevel'], (result) => {
    enhancementLevel.value = result.enhancementLevel || 'moderate';
  });
  
  enhancementLevel.addEventListener('change', (e) => {
    // Save to Chrome storage instead of localStorage
    chrome.storage.sync.set({ enhancementLevel: e.target.value }, () => {

    });
  });

  // Status indicator
  function setStatus(enabled) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    if (enabled) {
      statusDot.style.backgroundColor = '#10b981';
      statusText.textContent = 'Enabled';
    } else {
      statusDot.style.backgroundColor = '#ef4444';
      statusText.textContent = 'Disabled';
    }
  }
  setStatus(true);

  // Save Changes button (no animation)
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.addEventListener('click', () => {
    saveBtn.disabled = true;
    const original = saveBtn.innerHTML;
    
    const apiKey = apiKeyInput.value.trim();
    
    // Only save if user entered an actual API key (not the masked characters)
    if (apiKey && !apiKey.includes('●')) {
      // Send API key to background.js and save to storage
      chrome.runtime.sendMessage({ action: 'saveApiKey', apiKey });
      chrome.storage.sync.set({ apiKey: apiKey }, () => {
        // Show masked characters after saving
        apiKeyInput.value = '●'.repeat(24);
        apiKeyInput.placeholder = 'API key is saved';
        deleteApiKeyBtn.style.display = 'block';

      });
    }
    
    saveBtn.innerHTML = 'Saved!';
    setTimeout(() => {
      saveBtn.innerHTML = original;
      saveBtn.disabled = false;
    }, 1200);
  });

  // Options button
  document.getElementById('optionsBtn').addEventListener('click', () => {
    window.open('options/options.html', '_blank');
  });
});

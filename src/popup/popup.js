import './popup.css';

document.addEventListener('DOMContentLoaded', () => {
  // API Key show/hide
  const apiKeyInput = document.getElementById('apiKey');
  const toggleApiKey = document.getElementById('toggleApiKey');
  toggleApiKey.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
    toggleApiKey.setAttribute('aria-label', apiKeyInput.type === 'password' ? 'Show API key' : 'Hide API key');
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
      console.log('Enhancement level saved:', e.target.value);
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
    // Send API key to background.js
    const apiKey = apiKeyInput.value.trim();
    chrome.runtime.sendMessage({ action: 'saveApiKey', apiKey });
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

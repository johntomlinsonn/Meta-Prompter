// Content script
// This runs on web pages that match the patterns in the manifest

// Keep track of the currently focused input element
let activeInputElement = null;

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
  console.log('Page interaction set up');
  
  // Example: Add a class to the body element
  document.body.classList.add('chrome-extension-active');
  
  // Set up event listeners to detect active text input fields
  setupInputTracking();
}

// Initialize when the content script loads
initializeContentScript();

// Also set up input tracking immediately (don't wait for settings)
// This ensures we start logging text input right away
setupInputTracking();


// Function to set up tracking of text input fields
function setupInputTracking() {
  // Listen for focus events on the entire document
  document.addEventListener('focusin', handleFocusIn);
  
  // Listen for blur events (when element loses focus)
  document.addEventListener('focusout', handleFocusOut);
  
  // Also set up input event listener to detect typing
  document.addEventListener('input', handleInput);
  
  // Check if any input is already focused when the script loads
  const activeElement = document.activeElement;
  if (isTextInputElement(activeElement)) {
    handleInitialFocus(activeElement);
  }
}

// Handler for focus events
function handleFocusIn(event) {
  const element = event.target;
  
  // Check if the focused element is a text input or textarea
  if (isTextInputElement(element)) {
    activeInputElement = element;
    
    // Notify background script about the active input if needed
    chrome.runtime.sendMessage({ 
      type: 'inputFocused', 
      data: {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        placeholder: element.placeholder || '',
        url: window.location.href
      }
    });
    
    // You can add visual indication that the extension is active for this input
    markActiveInput(element);
  }
}

// Handler for when an element loses focus
function handleFocusOut(event) {
  if (activeInputElement === event.target) {
    console.log('Text input blurred:', event.target);
    
    // Clear the visual indication
    unmarkActiveInput(activeInputElement);
    
    // Clear the reference to the active element
    activeInputElement = null;
    
    // Notify background script if needed
    chrome.runtime.sendMessage({ type: 'inputBlurred' });
  }
}

// Handler for input events (typing)
function handleInput(event) {
  const element = event.target;
  
  // Check if this is our tracked element and it's a text input
  if (isTextInputElement(element) && element === activeInputElement) {
    
    // Get the current text value
    const currentText = element.value || element.textContent || '';
    
    // Print the text to the console every time the user types
    console.log('User is typing:', currentText);
    

  }
}

// Function to handle initial focus if an element is already focused
function handleInitialFocus(element) {
  console.log('Element already focused on page load:', element);
  activeInputElement = element;
  markActiveInput(element);
}

// Helper function to check if an element is a text input or textarea
function isTextInputElement(element) {
  if (!element) return false;
  
  // Check for textarea elements
  if (element.tagName === 'TEXTAREA') {
    return true;
  }
  
  // Check for input elements of type text, search, email, etc.
  if (element.tagName === 'INPUT') {
    const inputType = element.type ? element.type.toLowerCase() : '';
    const textInputTypes = ['text', 'search', 'email', 'url', 'tel', 'number', 'password'];
    return textInputTypes.includes(inputType);
  }
  
  // Check for contenteditable elements (like in Google Docs, Discord, etc.)
  if (element.isContentEditable) {
    return true;
  }
  
  return false;
}

// Function to visually mark the active input (optional)
function markActiveInput(element) {
  // Add a subtle indication that the input is being enhanced
  // This is optional and should be non-intrusive
  element.dataset.metaPromptActive = 'true';
  
  // You could also add a CSS class if you define styles in your extension
  // element.classList.add('meta-prompt-enhanced');
}

// Function to remove the visual indication
function unmarkActiveInput(element) {
  if (element) {
    delete element.dataset.metaPromptActive;
    // element.classList.remove('meta-prompt-enhanced');
  }
}

// This function would analyze and enhance a prompt
// This is a placeholder for your actual implementation
function analyzeAndEnhancePrompt(text, element) {
  // Print the text to the console for debugging and monitoring
  console.log('Analyzing text:', text);
  
  // Here you would implement your AI prompt enhancement logic
  // For example:
  // 1. Analyze the text for common prompt patterns
  // 2. Identify areas for improvement
  // 3. Suggest enhancements or automatically apply them
  
  // For demonstration, we'll just add a simple enhancement
  if (text.length > 10 && !text.includes('Please provide detailed information')) {
    // Example of showing a suggestion to the user
    showSuggestion(element, 'Consider adding "Please provide detailed information" to get better results.');
    
    // Or automatically enhance (be careful with this approach)
    // const enhancedText = text + '\n\nPlease provide detailed information.';
    // element.value = enhancedText;
  }
}

// Function to show a suggestion to the user
function showSuggestion(element, suggestionText) {
  // Create a suggestion element
  const suggestion = document.createElement('div');
  suggestion.className = 'meta-prompt-suggestion';
  suggestion.textContent = suggestionText;
  suggestion.style.cssText = `
    position: absolute;
    background: #f0f7ff;
    border: 1px solid #c0d7f7;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 14px;
    color: #333;
    z-index: 10000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: 300px;
    top: ${element.offsetTop + element.offsetHeight + 5}px;
    left: ${element.offsetLeft}px;
  `;
  
  // Add a close button
  const closeBtn = document.createElement('span');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 2px;
    right: 5px;
    cursor: pointer;
    font-size: 16px;
    color: #666;
  `;
  closeBtn.onclick = () => suggestion.remove();
  
  suggestion.appendChild(closeBtn);
  document.body.appendChild(suggestion);
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (document.body.contains(suggestion)) {
      suggestion.remove();
    }
  }, 8000);
}

// Function to handle messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  
  if (message.type === 'enhanceCurrentPrompt') {
    // Check if we have an active input element
    if (activeInputElement) {
     
      
      // Get the current text
      const currentText = activeInputElement.value || activeInputElement.textContent || '';
      
      // Implement your AI prompt enhancement logic here
      // The complexity of this will depend on your enhancement algorithm
      enhancePromptWithSettings(currentText, activeInputElement, message.settings);
    } else {
      // You could show a notification to the user that no input is focused
    }
  }
});


// Function to show an enhancement suggestion to the user
function showEnhancementSuggestion(element, enhancedText) {
  // Create a suggestion element with the enhanced text and buttons to apply or dismiss
  const suggestion = document.createElement('div');
  suggestion.className = 'meta-prompt-suggestion';
  suggestion.style.cssText = `
    position: absolute;
    background: #f0f7ff;
    border: 1px solid #c0d7f7;
    border-radius: 4px;
    padding: 12px;
    font-size: 14px;
    color: #333;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    max-width: 400px;
    top: ${element.offsetTop + element.offsetHeight + 5}px;
    left: ${element.offsetLeft}px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  
  // Add a title
  const title = document.createElement('div');
  title.textContent = 'Suggested Enhancement:';
  title.style.fontWeight = 'bold';
  suggestion.appendChild(title);
  
  // Add the enhanced text
  const textArea = document.createElement('textarea');
  textArea.value = enhancedText;
  textArea.style.cssText = `
    width: 100%;
    min-height: 100px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
  `;
  suggestion.appendChild(textArea);
  
  // Add buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: space-between;
    gap: 8px;
  `;
  
  // Apply button
  const applyButton = document.createElement('button');
  applyButton.textContent = 'Apply';
  applyButton.style.cssText = `
    padding: 6px 12px;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
  `;
  applyButton.onclick = () => {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = textArea.value;
      // Trigger input event
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (element.isContentEditable) {
      element.textContent = textArea.value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    suggestion.remove();
  };
  buttonContainer.appendChild(applyButton);
  
  // Dismiss button
  const dismissButton = document.createElement('button');
  dismissButton.textContent = 'Dismiss';
  dismissButton.style.cssText = `
    padding: 6px 12px;
    background-color:rgb(31, 24, 24);
    color: #333;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
  `;
  dismissButton.onclick = () => suggestion.remove();
  buttonContainer.appendChild(dismissButton);
  
  suggestion.appendChild(buttonContainer);
  
  // Add to the page
  document.body.appendChild(suggestion);
  
  // Allow for dragging the suggestion (basic implementation)
  let isDragging = false;
  let offsetX, offsetY;
  
  title.style.cursor = 'move';
  title.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - suggestion.getBoundingClientRect().left;
    offsetY = e.clientY - suggestion.getBoundingClientRect().top;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      suggestion.style.left = (e.clientX - offsetX) + 'px';
      suggestion.style.top = (e.clientY - offsetY) + 'px';
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}

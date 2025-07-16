// Minimal content script for Meta-Prompter button

import { handleMetaPrompt } from '../utils/helpers.js';
import { createMetaPromptButton } from './MetaPromptButton.js';
import { createPromptReviewPanel } from './PromptReviewPanel.js';
import { showError, ErrorTypes, showApiKeyError, showInternetError, showNoPromptError } from './ErrorNotification.js';

let activeInputElement = null;
let activePromptPanel = null;

function isTextInputElement(element) {
  if (!element) return false;
  if (element.tagName === 'TEXTAREA') return true;
  if (element.tagName === 'INPUT') {
    const inputType = element.type ? element.type.toLowerCase() : '';
    const textInputTypes = ['text', 'search', 'email', 'url', 'tel', 'number', 'password'];
    return textInputTypes.includes(inputType);
  }
  if (element.isContentEditable) return true;
  return false;
}

function removeMetaPromptButton(element) {
  if (element && element._metaPromptButton) {
    element._metaPromptButton.remove();
    delete element._metaPromptButton;
  }
}

function injectMetaPromptButton(element) {
  // Only inject if not already present
  if (element._metaPromptButton) return;
  const onClick = () => {
    let value = '';
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      value = element.value;
    } else if (element.isContentEditable) {
      value = element.innerText;
    }
    
    // Check if prompt is empty
    if (!value || value.trim().length === 0) {
      showNoPromptError();
      return;
    }
    
    if (activePromptPanel) {
      activePromptPanel.overlay.remove();
      activePromptPanel = null;
    }

    chrome.runtime.sendMessage({ type: 'generatePromptQuestions', prompt: value }, (response) => {
      // Check for chrome runtime errors
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        showError('API_ERROR', 'Extension communication error. Please try reloading the page.');
        return;
      }
      
      // Check for API key or internet connection errors
      if (response && response.error) {
        switch (response.error) {
          case 'NO_API_KEY':
            showApiKeyError();
            break;
          case 'NO_INTERNET':
            showInternetError();
            break;
          case 'RATE_LIMIT':
            showError('RATE_LIMIT');
            break;
          case 'INVALID_RESPONSE':
            showError('INVALID_RESPONSE');
            break;
          default:
            showError('API_ERROR', response.error);
        }
        return;
      }
      
      if (response && response.questions && Array.isArray(response.questions) && response.questions.length > 0) {
        let qaPairs = [];
        let currentQuestionIndex = 0;
        function handleAnswer(answer) {
          qaPairs.push({ question: response.questions[currentQuestionIndex], answer });
          currentQuestionIndex++;
          if (currentQuestionIndex < response.questions.length) {
            activePromptPanel.setQuestion(response.questions[currentQuestionIndex]);
          } else {
            chrome.runtime.sendMessage({
              type: 'metaPrompt',
              prompt: value + "Here are questions and answers that the user has answered. Please improve the prompt based on the user's answers." + JSON.stringify(qaPairs),
            }, 
            (improveResp) => {
              // Check for chrome runtime errors
              if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError);
                showError('API_ERROR', 'Extension communication error. Please try reloading the page.');
                if (activePromptPanel) {
                  activePromptPanel.overlay.remove();
                  activePromptPanel = null;
                }
                return;
              }
              
              // Check for API errors in improvement response
              if (improveResp && improveResp.error) {
                switch (improveResp.error) {
                  case 'NO_API_KEY':
                    showApiKeyError();
                    break;
                  case 'NO_INTERNET':
                    showInternetError();
                    break;
                  case 'RATE_LIMIT':
                    showError('RATE_LIMIT');
                    break;
                  case 'INVALID_RESPONSE':
                    showError('INVALID_RESPONSE');
                    break;
                  default:
                    showError('API_ERROR', improveResp.error);
                }
                if (activePromptPanel) {
                  activePromptPanel.overlay.remove();
                  activePromptPanel = null;
                }
                return;
              }
              
              improveResp = handleMetaPrompt(improveResp);
              console.log(improveResp);
              if (improveResp) {
                if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
                  element.value = improveResp;
                } else if (element.isContentEditable) {
                  element.innerText = improveResp;
                }
              } else {
                showError('INVALID_RESPONSE', 'Failed to process the improved prompt.');
              }
              if (activePromptPanel) {
                activePromptPanel.overlay.remove();
                activePromptPanel = null;
              }
            });
          }
        }
        activePromptPanel = createPromptReviewPanel({
          question: response.questions[0],
          onAnswer: handleAnswer
        });
        document.body.appendChild(activePromptPanel.overlay);
      } else {
        showError('INVALID_RESPONSE', 'Failed to generate improvement questions. Please try again.');
      }
    });
  };
  const button = createMetaPromptButton(element, onClick);
  positionButton(button, element);
  document.body.appendChild(button);
  element._metaPromptButton = button;
}

function positionButton(button, element) {
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const buttonSize = 24;
  const padding = 4;
  let top, left;
  // Place in the top right corner of the input/textarea/contenteditable
  top = rect.top + scrollTop + padding;
  left = rect.right + scrollLeft - buttonSize - padding;
  button.style.top = `${top}px`;
  button.style.left = `${left}px`;
}

function showClickFeedback(element) {
  const feedback = document.createElement('div');
  feedback.textContent = 'Text captured!';
  feedback.style.cssText = `
    position: absolute;
    background: #4285f4;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10001;
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.3s ease;
  `;
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  feedback.style.top = `${rect.bottom + scrollTop + 5}px`;
  feedback.style.left = `${rect.right + scrollLeft - 80}px`;
  document.body.appendChild(feedback);
  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(feedback)) {
        feedback.remove();
      }
    }, 300);
  }, 1500);
}

document.addEventListener('focusin', (event) => {
  const element = event.target;
  if (isTextInputElement(element)) {
    if (activeInputElement && activeInputElement !== element) {
      removeMetaPromptButton(activeInputElement);
    }
    activeInputElement = element;
    let value = '';
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      value = element.value;
    } else if (element.isContentEditable) {
      value = element.innerText;
    }
    if (value && value.length > 0) {
      injectMetaPromptButton(element);
    } else {
      removeMetaPromptButton(element);
    }
  }
});
document.addEventListener('input', (event) => {
  const element = event.target;
  if (isTextInputElement(element) && element === activeInputElement) {
    let value = '';
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      value = element.value;
    } else if (element.isContentEditable) {
      value = element.innerText;
    }
    if (value && value.length > 0) {
      if (!element._metaPromptButton) {
        injectMetaPromptButton(element);
      } else {
        positionButton(element._metaPromptButton, element);
      }
    } else {
      removeMetaPromptButton(element);
    }
  }
});
window.addEventListener('scroll', () => {
  if (activeInputElement && activeInputElement._metaPromptButton) {
    positionButton(activeInputElement._metaPromptButton, activeInputElement);
  }
});
window.addEventListener('resize', () => {
  if (activeInputElement && activeInputElement._metaPromptButton) {
    positionButton(activeInputElement._metaPromptButton, activeInputElement);
  }
});

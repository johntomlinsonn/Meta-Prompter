// Minimal content script for Meta-Prompter button

import { handleMetaPrompt } from '../utils/helpers.js';

let activeInputElement = null;

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
  const button = document.createElement('div');
  button.className = 'meta-prompt-button';
  button.setAttribute('data-meta-prompt-button', 'true');
  // Use the correct path for the built extension
  const iconPath = chrome.runtime.getURL('assets/icons/icon16.png');
  const iconImg = document.createElement('img');
  iconImg.src = iconPath;
  iconImg.alt = 'Meta-Prompt';
  iconImg.style.width = '16px';
  iconImg.style.height = '16px';
  iconImg.style.display = 'block';
  iconImg.style.margin = 'auto';
  button.appendChild(iconImg);
  button.style.cssText = `
    position: absolute;
    width: 28px;
    height: 28px;
    background: #fff;
    border: 1.5px solid #d3e3fd;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    box-shadow: 0 2px 6px rgba(60, 64, 67, 0.15);
    transition: box-shadow 0.2s, border-color 0.2s, background 0.2s;
  `;
  button.addEventListener('mouseenter', () => {
    button.style.background = '#e8f0fe';
    button.style.borderColor = '#4285f4';
    button.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.18)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.background = '#fff';
    button.style.borderColor = '#d3e3fd';
    button.style.boxShadow = '0 2px 6px rgba(60, 64, 67, 0.15)';
  });
  button.onclick = (e) => {
    e.stopPropagation();
    let value = '';
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      value = element.value;
    } else if (element.isContentEditable) {
      value = element.innerText;
    }
    handleMetaPrompt(value, (aiText, error) => {
      if (aiText) {
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
          element.value = aiText;
        } else if (element.isContentEditable) {
          element.innerText = aiText;
        }
      } else if (error) {
        console.error(error);
      }
    });
  };
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
  if (element.tagName === 'TEXTAREA' || element.isContentEditable) {
    top = rect.bottom + scrollTop - buttonSize - padding;
    left = rect.right + scrollLeft - buttonSize - padding;
  } else {
    top = rect.top + scrollTop + (rect.height - buttonSize) / 2;
    left = rect.right + scrollLeft - buttonSize - padding;
  }
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
    injectMetaPromptButton(element);
  }
});
document.addEventListener('input', (event) => {
  const element = event.target;
  if (isTextInputElement(element) && element === activeInputElement) {
    const button = element._metaPromptButton;
    if (button) positionButton(button, element);
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

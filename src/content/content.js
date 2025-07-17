// Minimal content script for Meta-Prompter button

import { handleMetaPrompt } from '../utils/helpers.js';
import { createMetaPromptButton } from './MetaPromptButton.js';
import { createPromptReviewPanel } from './PromptReviewPanel.js';
import { showError, ErrorTypes, showApiKeyError, showInternetError, showNoPromptError } from './ErrorNotification.js';
import { showQuestionsLoading, showPromptLoading } from './LoadingAnimation.js';

let activeInputElement = null;
let activePromptPanel = null;
let currentLoadingAnimation = null;

// Helper function to clean up loading animation
function hideLoadingAnimation() {
  if (currentLoadingAnimation) {
    currentLoadingAnimation.hide();
    currentLoadingAnimation = null;
  }
}

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
    
    // Clean up any existing loading animation
    hideLoadingAnimation();

    // Check enhancement level to determine flow
    chrome.storage.sync.get(['enhancementLevel'], (result) => {
      const enhancementLevel = result.enhancementLevel || 'moderate';
      
      if (enhancementLevel === 'light') {
        // Show loading animation for prompt generation
        currentLoadingAnimation = showPromptLoading();
        currentLoadingAnimation.show();
        
        // For light enhancement, skip questions and go straight to prompt improvement
        chrome.runtime.sendMessage({
          type: 'metaPrompt',
          prompt: value,
        }, (improveResp) => {
          // Hide loading animation
          if (currentLoadingAnimation) {
            currentLoadingAnimation.hide();
            currentLoadingAnimation = null;
          }
          
          // Check for chrome runtime errors
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            showError('API_ERROR', 'Extension communication error. Please try reloading the page.');
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
        });
      } else {
        // Show loading animation for questions generation
        currentLoadingAnimation = showQuestionsLoading();
        currentLoadingAnimation.show();
        
        // For moderate and aggressive enhancement, use the question flow
        chrome.runtime.sendMessage({ type: 'generatePromptQuestions', prompt: value }, (response) => {
          // Hide loading animation
          if (currentLoadingAnimation) {
            currentLoadingAnimation.hide();
            currentLoadingAnimation = null;
          }
          
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
            let secondRoundQaPairs = [];
            let currentQuestionIndex = 0;
            const enhancementLevel = result.enhancementLevel || 'moderate';
            
            function handleAnswer(answer) {
              qaPairs.push({ question: response.questions[currentQuestionIndex], answer });
              currentQuestionIndex++;
              if (currentQuestionIndex < response.questions.length) {
                activePromptPanel.setQuestion(response.questions[currentQuestionIndex]);
              } else {
                // All questions for first round answered
                
                // For aggressive/high enhancement, start second round of questions
                if (enhancementLevel === 'aggressive') {
                  // Create a message summarizing the first round of answers
                  const contextMessage = `Original prompt: "${value}"\n\nThe user has answered the following clarifying questions:\n${qaPairs.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}\n\n`;
                  
                  // Show loading animation for second round questions
                  currentLoadingAnimation = showQuestionsLoading();
                  currentLoadingAnimation.show();
                  
                  // Generate second round of questions based on first round answers
                  chrome.runtime.sendMessage({
                    type: 'generatePromptQuestions',
                    prompt: contextMessage + "Based on these answers, please generate more specific follow-up questions to further refine the prompt."
                  }, (secondResponse) => {
                    // Hide loading animation
                    if (currentLoadingAnimation) {
                      currentLoadingAnimation.hide();
                      currentLoadingAnimation = null;
                    }
                    
                    // Check for errors
                    if (chrome.runtime.lastError) {
                      console.error('Chrome runtime error:', chrome.runtime.lastError);
                      showError('API_ERROR', 'Extension communication error. Please try reloading the page.');
                      if (activePromptPanel) {
                        activePromptPanel.overlay.remove();
                        activePromptPanel = null;
                      }
                      return;
                    }
                    
                    if (secondResponse && secondResponse.error) {
                      switch (secondResponse.error) {
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
                          showError('API_ERROR', secondResponse.error);
                      }
                      if (activePromptPanel) {
                        activePromptPanel.overlay.remove();
                        activePromptPanel = null;
                      }
                      return;
                    }
                    
                    // Process second round questions
                    if (secondResponse && secondResponse.questions && Array.isArray(secondResponse.questions) && secondResponse.questions.length > 0) {
                      currentQuestionIndex = 0;
                      
                      // Update the question handler to handle second round questions
                      function handleSecondRoundAnswer(answer) {
                        secondRoundQaPairs.push({ question: secondResponse.questions[currentQuestionIndex], answer });
                        currentQuestionIndex++;
                        
                        if (currentQuestionIndex < secondResponse.questions.length) {
                          // Show next question, indicating it's from the second round
                          activePromptPanel.setQuestion(secondResponse.questions[currentQuestionIndex], true);
                        } else {
                          // All second round questions answered, generate final prompt
                          generateFinalPrompt();
                        }
                      }
                      
                      // Update the panel with new questions and handler
                      activePromptPanel.setQuestion(secondResponse.questions[0], true);
                      activePromptPanel.updateAnswerHandler(handleSecondRoundAnswer);
                      
                    } else {
                      // If second round questions failed, fall back to using just first round
                      generateFinalPrompt();
                    }
                  });
                } else {
                  // For moderate enhancement, proceed directly to prompt generation
                  generateFinalPrompt();
                }
              }
            }
            
            function generateFinalPrompt() {
              // Show loading animation for final prompt generation
              currentLoadingAnimation = showPromptLoading();
              currentLoadingAnimation.show();
              
              // Create the prompt enhancement request
              let enhancementPrompt = value;
              
              // Add first round Q&A
              if (qaPairs.length > 0) {
                enhancementPrompt += "\n\nHere are questions and answers that the user has provided to help improve the prompt:\n" + 
                  JSON.stringify(qaPairs.map(qa => ({question: qa.question, answer: qa.answer})));
              }
              
              // Add second round Q&A if available
              if (secondRoundQaPairs.length > 0) {
                enhancementPrompt += "\n\nHere are follow-up questions and answers that provide additional context:\n" + 
                  JSON.stringify(secondRoundQaPairs.map(qa => ({question: qa.question, answer: qa.answer})));
              }
              
              // Send the final prompt for improvement
              chrome.runtime.sendMessage({
                type: 'metaPrompt',
                prompt: enhancementPrompt
              }, 
              (improveResp) => {
                // Hide loading animation
                if (currentLoadingAnimation) {
                  currentLoadingAnimation.hide();
                  currentLoadingAnimation = null;
                }
                
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
            activePromptPanel = createPromptReviewPanel({
              question: response.questions[0],
              onAnswer: handleAnswer
            });
            document.body.appendChild(activePromptPanel.overlay);
          } else {
            showError('INVALID_RESPONSE', 'Failed to generate improvement questions. Please try again.');
          }
        });
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
  const buttonSize = 28; // Updated to match actual button size
  const verticalOffset = 8; // Distance above the text box
  const horizontalOffset = 8; // Distance to the right of the text box
  let top, left;
  
  // Position the button above and to the right of the text box
  top = rect.top + scrollTop - buttonSize - verticalOffset;
  left = rect.right + scrollLeft + horizontalOffset;
  
  // Ensure the button doesn't go off-screen
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Adjust horizontal position if it would go off the right edge
  if (left + buttonSize > viewportWidth + scrollLeft) {
    left = rect.left + scrollLeft - buttonSize - horizontalOffset;
  }
  
  // Adjust vertical position if it would go above the viewport
  if (top < scrollTop) {
    top = rect.bottom + scrollTop + verticalOffset;
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

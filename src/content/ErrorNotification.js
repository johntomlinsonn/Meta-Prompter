// ErrorNotification.js
// Translucent error notification component for prompt creation failures

/**
 * Creates an error notification overlay that appears on top of the page
 * @param {Object} options
 * @param {string} options.message - The error message to display
 * @param {number} options.duration - How long to show the notification (ms)
 * @param {function} options.onClose - Callback when notification is closed
 * @returns {Object} { show, hide, destroy }
 */
export function createErrorNotification({
  message = 'An error occurred',
  duration = 5000,
  onClose
} = {}) {
  // Create notification overlay
  const notification = document.createElement('div');
  notification.className = 'mp-error-notification';
  notification.innerHTML = `
    <style>
      .mp-error-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 2px solid rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        padding: 16px 20px;
        z-index: 2147483647;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1);
        animation: mp-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Inter', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      }
      
      @keyframes mp-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes mp-slide-out {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .mp-error-notification.mp-hiding {
        animation: mp-slide-out 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .mp-error-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .mp-error-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #000000;
      }
      
      .mp-error-icon {
        width: 18px;
        height: 18px;
        color: #dc2626;
        fill: #dc2626;
      }
      
      .mp-error-close {
        background: none;
        border: none;
        color: #000000;
        font-size: 18px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: all 0.2s ease;
        line-height: 1;
      }
      
      .mp-error-close:hover {
        background: rgba(0, 0, 0, 0.1);
      }
      
      .mp-error-message {
        font-size: 13px;
        color: #000000;
        line-height: 1.4;
        margin: 0;
      }
      
      .mp-error-progress {
        width: 100%;
        height: 2px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 1px;
        margin-top: 12px;
        overflow: hidden;
      }
      
      .mp-error-progress-bar {
        width: 100%;
        height: 100%;
        background: #dc2626;
        border-radius: 1px;
        animation: mp-progress 5s linear;
        transform-origin: left;
      }
      
      @keyframes mp-progress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }
    </style>
    
    <div class="mp-error-header">
      <div class="mp-error-title">
        <svg class="mp-error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
        </svg>
        Meta-Prompter Error
      </div>
      <button class="mp-error-close" aria-label="Close notification">&times;</button>
    </div>
    
    <p class="mp-error-message">${message}</p>
    
    <div class="mp-error-progress">
      <div class="mp-error-progress-bar"></div>
    </div>
  `;

  let timeoutId;
  let isDestroyed = false;

  // Close button handler
  const closeButton = notification.querySelector('.mp-error-close');
  closeButton.addEventListener('click', hide);

  // Auto-hide functionality
  function startAutoHide() {
    if (duration > 0) {
      timeoutId = setTimeout(hide, duration);
    }
  }

  // Show notification
  function show() {
    if (isDestroyed) return;
    
    document.body.appendChild(notification);
    startAutoHide();
    
    // Update progress bar duration
    const progressBar = notification.querySelector('.mp-error-progress-bar');
    if (progressBar && duration > 0) {
      progressBar.style.animationDuration = `${duration}ms`;
    }
  }

  // Hide notification with animation
  function hide() {
    if (isDestroyed) return;
    
    clearTimeout(timeoutId);
    notification.classList.add('mp-hiding');
    
    setTimeout(() => {
      destroy();
    }, 300); // Match animation duration
  }

  // Destroy notification completely
  function destroy() {
    if (isDestroyed) return;
    
    isDestroyed = true;
    clearTimeout(timeoutId);
    
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    
    if (typeof onClose === 'function') {
      onClose();
    }
  }

  return {
    show,
    hide,
    destroy
  };
}

/**
 * Show different types of error notifications
 */
export const ErrorTypes = {
  NO_API_KEY: 'No API key found. Please add your Cerebras API key in the extension settings.',
  NO_INTERNET: 'No internet connection. Please check your network and try again.',
  NO_PROMPT: 'No prompt provided. Please enter a prompt to enhance.',
  API_ERROR: 'API request failed. Please try again in a moment.',
  RATE_LIMIT: 'Rate limit exceeded. Please wait a moment before trying again.',
  INVALID_RESPONSE: 'Received invalid response from API. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

/**
 * Quick helper to show specific error types
 */
export function showError(errorType, customMessage = null) {
  const message = customMessage || ErrorTypes[errorType] || ErrorTypes.UNKNOWN_ERROR;
  
  const notification = createErrorNotification({
    message,
    duration: 5000
  });
  
  notification.show();
  return notification;
}

/**
 * Show API key error specifically
 */
export function showApiKeyError() {
  return showError('NO_API_KEY');
}

/**
 * Show internet connection error
 */
export function showInternetError() {
  return showError('NO_INTERNET');
}

/**
 * Show no prompt error
 */
export function showNoPromptError() {
  return showError('NO_PROMPT');
}

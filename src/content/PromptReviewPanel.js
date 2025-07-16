// PromptReviewPanel.js
// Sidebar component for reviewing and refining prompts

/**
 * Creates the Prompt Review Panel sidebar.
 * @param {Object} options
 * @param {string} options.originalPrompt
 * @param {string} options.enhancedPrompt
 * @param {function} options.onAccept
 * @param {function} options.onRefine
 * @param {function} options.onCopy
 * @param {function} options.onInject
 * @param {function} options.onRestart
 * @param {function} options.onSkip
 * @param {function} options.onUserReply
 * @returns {Object} { panel, setStep, setChat, setFinalPrompt, close }
 */
export function createPromptReviewPanel({
  question = '',
  onAnswer
} = {}) {
  // Create overlay and sidebar
  const overlay = document.createElement('div');
  overlay.className = 'mprp-overlay';
  // Function to determine if background is dark
  function getAdaptiveColors() {
    // Sample the background color behind the panel
    const body = document.body;
    const html = document.documentElement;
    
    // Get computed styles
    const bodyStyles = window.getComputedStyle(body);
    const htmlStyles = window.getComputedStyle(html);
    
    // Check various background properties
    const bodyBg = bodyStyles.backgroundColor;
    const htmlBg = htmlStyles.backgroundColor;
    const bodyBgImage = bodyStyles.backgroundImage;
    
    // Function to parse RGB values and calculate luminance
    function getLuminance(color) {
      if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return null;
      
      const rgb = color.match(/\d+/g);
      if (!rgb || rgb.length < 3) return null;
      
      const [r, g, b] = rgb.map(x => {
        x = parseInt(x) / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    
    // Check if we can determine the background luminance
    let luminance = getLuminance(bodyBg) || getLuminance(htmlBg);
    
    // If we can't determine from solid colors, check for common dark/light themes
    const isDarkTheme = 
      body.classList.contains('dark') ||
      body.classList.contains('dark-theme') ||
      html.classList.contains('dark') ||
      html.classList.contains('dark-theme') ||
      bodyBg.includes('rgb(0') || bodyBg.includes('rgb(1') || bodyBg.includes('rgb(2') ||
      bodyBgImage.includes('gradient') && bodyBg.includes('rgb(0');
    
    const isLightTheme = 
      body.classList.contains('light') ||
      body.classList.contains('light-theme') ||
      html.classList.contains('light') ||
      html.classList.contains('light-theme');
    
    // Determine if background is dark
    let isDark;
    if (luminance !== null) {
      isDark = luminance < 0.5;
    } else if (isDarkTheme) {
      isDark = true;
    } else if (isLightTheme) {
      isDark = false;
    } else {
      // Default fallback - assume light theme
      isDark = false;
    }
    
    // Return appropriate colors
    if (isDark) {
      return {
        textColor: '#ffffff',
        textColorSecondary: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backgroundColorHover: 'rgba(0, 0, 0, 0.5)',
        placeholderColor: 'rgba(255, 255, 255, 0.6)'
      };
    } else {
      return {
        textColor: '#1f2937',
        textColorSecondary: 'rgba(31, 41, 55, 0.8)',
        borderColor: 'rgba(0, 0, 0, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        backgroundColorHover: 'rgba(255, 255, 255, 0.5)',
        placeholderColor: 'rgba(31, 41, 55, 0.6)'
      };
    }
  }
  
  const colors = getAdaptiveColors();
  
  overlay.innerHTML = `
    <style>
      .mprp-overlay {
        position: fixed;
        top: 0; right: 0; width: 20vw; min-width: 340px; max-width: 480px; height: 100vh;
        background: transparent;
        z-index: 2147483647;
        display: flex;
        justify-content: flex-end;
        align-items: stretch;
      }
      .mprp-sidebar {
        width: 100%;
        height: 100vh;
        background: ${colors.backgroundColor};
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        border-radius: 0;
        display: flex;
        flex-direction: column;
        animation: mprp-slide-in 0.25s cubic-bezier(.4,1.4,.6,1) 1;
        border-left: 1px solid ${colors.borderColor};
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-right: none;
        position: relative;
        overflow: hidden;
      }
      @keyframes mprp-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .mprp-header {
        padding: 20px 24px 14px 24px;
        font-size: 18px;
        font-weight: 500;
        color: ${colors.textColor};
        background: ${colors.backgroundColor};
        border-radius: 0;
        letter-spacing: -0.3px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid ${colors.borderColor};
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .mprp-close {
        background: none;
        border: none;
        color: ${colors.textColor};
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      .mprp-close:hover {
        background: ${colors.backgroundColorHover};
        color: ${colors.textColor};
      }
      .mprp-question-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 32px 24px 0 24px;
        background: transparent;
      }
      .mprp-question-label {
        font-size: 16px;
        color: ${colors.textColor};
        font-weight: 400;
        margin-bottom: 24px;
        text-align: center;
        background: ${colors.backgroundColor};
        border-radius: 8px;
        padding: 16px;
        border: 1px solid ${colors.borderColor};
        max-width: 90%;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .mprp-input-area {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        max-width: 90%;
        padding: 0 0 24px 0;
        background: transparent;
      }
      .mprp-input-field {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid ${colors.borderColor};
        border-radius: 8px;
        background-color: ${colors.backgroundColor};
        color: ${colors.textColor};
        font-size: 15px;
        font-weight: 400;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .mprp-input-field:focus {
        border-color: ${colors.textColorSecondary};
        background-color: ${colors.backgroundColorHover};
        color: ${colors.textColor};
        outline: none;
      }
      .mprp-input-field::placeholder {
        color: ${colors.placeholderColor};
      }
      .mprp-send-btn {
        background: ${colors.backgroundColor};
        color: ${colors.textColor};
        border: 1px solid ${colors.borderColor};
        border-radius: 8px;
        font-size: 15px;
        font-weight: 500;
        padding: 12px 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .mprp-send-btn:hover, .mprp-send-btn:focus {
        background: ${colors.backgroundColorHover};
        color: ${colors.textColor};
        border-color: ${colors.textColorSecondary};
        outline: none;
      }
    </style>
  `;

  // Create sidebar element
  const sidebar = document.createElement('div');
  sidebar.className = 'mprp-sidebar';

  // Header
  const header = document.createElement('div');
  header.className = 'mprp-header';
  header.innerHTML = `
    <span>Prompt Improvement</span>
    <button class="mprp-close" aria-label="Close">&times;</button>
  `;

  // Question area
  const questionArea = document.createElement('div');
  questionArea.className = 'mprp-question-area';
  const questionLabel = document.createElement('div');
  questionLabel.className = 'mprp-question-label';
  questionLabel.textContent = `Hello! I need some clarity to improve your prompt. ${question}`;
  questionArea.appendChild(questionLabel);

  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'mprp-input-area';
  inputArea.innerHTML = `
    <input class="mprp-input-field" type="text" placeholder="Type your answer..." />
    <button class="mprp-send-btn">Send</button>
  `;
  const inputField = inputArea.querySelector('.mprp-input-field');
  const sendBtn = inputArea.querySelector('.mprp-send-btn');

  // Send handler
  sendBtn.addEventListener('click', () => {
    if (inputField.value.trim()) {
      if (typeof onAnswer === 'function') onAnswer(inputField.value.trim());
      inputField.value = '';
    }
  });
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inputField.value.trim()) {
      if (typeof onAnswer === 'function') onAnswer(inputField.value.trim());
      inputField.value = '';
    }
  });

  questionArea.appendChild(inputArea);

  // Compose sidebar
  sidebar.appendChild(header);
  sidebar.appendChild(questionArea);

  // Close button handler
  const closeButton = sidebar.querySelector('.mprp-close');
  closeButton.addEventListener('click', () => {
    overlay.remove();
  });

  overlay.appendChild(sidebar);

  // API for updating question
  function setQuestion(newQ) {
    questionLabel.textContent = `Hello! I need some clarity to improve your prompt. ${newQ}`;
    inputField.value = '';
    inputField.focus();
  }

  return {
    overlay,
    panel: sidebar,
    setQuestion,
    close: () => overlay.remove()
  };
}
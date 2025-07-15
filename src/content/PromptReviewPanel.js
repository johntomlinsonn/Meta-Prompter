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
        background: rgba(255,255,255,0.05);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
        border-radius: 0;
        display: flex;
        flex-direction: column;
        animation: mprp-slide-in 0.25s cubic-bezier(.4,1.4,.6,1) 1;
        border-left: 1px solid rgba(255,255,255,0.1);
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
        color: #fff;
        mix-blend-mode: difference;
        background: rgba(255,255,255,0.05);
        border-radius: 0;
        letter-spacing: -0.3px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .mprp-close {
        background: none;
        border: none;
        color: #fff;
        mix-blend-mode: difference;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      .mprp-close:hover {
        background: rgba(255,255,255,0.15);
        color: #fff;
        mix-blend-mode: difference;
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
        color: #fff;
        mix-blend-mode: difference;
        font-weight: 400;
        margin-bottom: 24px;
        text-align: center;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 16px;
        border: 1px solid rgba(255,255,255,0.15);
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
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        background-color: rgba(255,255,255,0.1);
        color: #fff;
        mix-blend-mode: difference;
        font-size: 15px;
        font-weight: 400;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .mprp-input-field:focus {
        border-color: rgba(255,255,255,0.4);
        background-color: rgba(255,255,255,0.15);
        color: #fff;
        mix-blend-mode: difference;
        outline: none;
      }
      .mprp-input-field::placeholder {
        color: rgba(255,255,255,0.7);
        mix-blend-mode: difference;
      }
      .mprp-send-btn {
        background: rgba(255,255,255,0.15);
        color: #fff;
        mix-blend-mode: difference;
        border: 1px solid rgba(255,255,255,0.3);
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
        background: rgba(255,255,255,0.25);
        color: #fff;
        mix-blend-mode: difference;
        border-color: rgba(255,255,255,0.5);
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
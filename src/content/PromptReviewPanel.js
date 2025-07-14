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
  messages = [
    { role: 'ai', content: 'Hi! I can help you improve your prompt. What are you trying to achieve?' },
    { role: 'user', content: 'I want to write a summary of a research paper for a general audience.' },
    { role: 'ai', content: 'Great! Who is your intended audience? (e.g., students, professionals, the public)' },
    { role: 'user', content: 'The general public, no technical background.' },
    { role: 'ai', content: 'Understood. Would you like the summary to be brief or detailed?' }
  ],
  onSend
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
        background: rgba(255,255,255,0.22);
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 1.5px 8px 0 rgba(255,255,255,0.18) inset;
        border-radius: 18px 0 0 18px;
        display: flex;
        flex-direction: column;
        animation: mprp-slide-in 0.25s cubic-bezier(.4,1.4,.6,1) 1;
        border-left: 1.5px solid rgba(255,255,255,0.35);
        border-top: 1.5px solid rgba(255,255,255,0.18);
        border-bottom: 1.5px solid rgba(255,255,255,0.18);
        backdrop-filter: blur(24px) saturate(1.25);
        -webkit-backdrop-filter: blur(24px) saturate(1.25);
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
        font-weight: 600;
        color: #e3e8f7;
        background: linear-gradient(90deg, rgba(99,102,241,0.32) 0%, rgba(6,182,212,0.18) 100%);
        border-radius: 18px 0 0 0;
        letter-spacing: -0.5px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,0.18);
        box-shadow: 0 2px 8px 0 rgba(99,102,241,0.06);
      }
      .mprp-close {
        background: none;
        border: none;
        color: #e3e8f7;
        font-size: 22px;
        cursor: pointer;
        padding: 0 4px;
        border-radius: 6px;
        transition: background 0.2s, color 0.2s;
      }
      .mprp-close:hover {
        background: rgba(255,255,255,0.10);
        color: #fff;
      }
      .mprp-messages-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        padding: 18px 18px 12px 18px;
        background: transparent;
        border-radius: 0;
        border: none;
        margin: 0;
        min-height: 0;
        box-shadow: none;
        backdrop-filter: none;
      }
      .mprp-chat-row {
        display: flex;
        align-items: flex-end;
        gap: 10px;
      }
      .mprp-chat-ai {
        justify-content: flex-start;
      }
      .mprp-chat-user {
        justify-content: flex-end;
      }
      .mprp-chat-bubble {
        max-width: 70%;
        padding: 12px 16px;
        border-radius: 14px;
        font-size: 15px;
        line-height: 1.5;
        box-shadow: 0 2px 8px 0 rgba(99,102,241,0.10);
        background: rgba(255,255,255,0.38);
        color: #222b45;
        position: relative;
        border: 1px solid rgba(255,255,255,0.32);
        backdrop-filter: blur(8px) saturate(1.1);
        -webkit-backdrop-filter: blur(8px) saturate(1.1);
      }
      .mprp-chat-ai .mprp-chat-bubble {
        background: rgba(236,242,255,0.55);
        color: #2e3a59;
        border-bottom-left-radius: 4px;
        border: 1px solid rgba(99,102,241,0.10);
      }
      .mprp-chat-user .mprp-chat-bubble {
        background: rgba(99,102,241,0.18);
        color: #fff;
        border-bottom-right-radius: 4px;
        border: 1px solid rgba(99,102,241,0.18);
      }
      .mprp-input-area {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 18px 18px 24px 18px;
        border-top: 1px solid rgba(255,255,255,0.18);
        background: transparent;
      }
      .mprp-input-field {
        flex: 1;
        padding: 12px 16px;
        border: 1.5px solid rgba(255,255,255,0.32);
        border-radius: 12px;
        background-color: rgba(255,255,255,0.65);
        color: #2e3a59;
        font-size: 15px;
        font-weight: 500;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 4px 0 rgba(99,102,241,0.06);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      .mprp-input-field:focus {
        border-color: #a5b4fc;
        box-shadow: 0 0 0 2px #e0e7ff;
        outline: none;
      }
      .mprp-send-btn {
        background: linear-gradient(90deg, rgba(99,102,241,0.32) 0%, rgba(6,182,212,0.18) 100%);
        color: #fff;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 700;
        padding: 12px 20px;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s;
        box-shadow: 0 2px 8px 0 rgba(99,102,241,0.10);
      }
      .mprp-send-btn:hover, .mprp-send-btn:focus {
        background: linear-gradient(90deg, rgba(99,102,241,0.45) 0%, rgba(6,182,212,0.28) 100%);
        color: #fff;
        box-shadow: 0 6px 24px 0 rgba(99,102,241,0.18);
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

  // Messages area
  const messagesArea = document.createElement('div');
  messagesArea.className = 'mprp-messages-area';
  function renderMessages(msgs) {
    messagesArea.innerHTML = msgs.map(msg => `
      <div class="mprp-chat-row mprp-chat-${msg.role}">
        <div class="mprp-chat-bubble">${msg.content}</div>
      </div>
    `).join('');
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
  renderMessages(messages);

  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'mprp-input-area';
  inputArea.innerHTML = `
    <input class="mprp-input-field" type="text" placeholder="Type your reply..." />
    <button class="mprp-send-btn">Send</button>
  `;
  const inputField = inputArea.querySelector('.mprp-input-field');
  const sendBtn = inputArea.querySelector('.mprp-send-btn');

  // Send handler
  sendBtn.addEventListener('click', () => {
    if (inputField.value.trim()) {
      if (typeof onSend === 'function') onSend(inputField.value.trim());
      inputField.value = '';
    }
  });
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inputField.value.trim()) {
      if (typeof onSend === 'function') onSend(inputField.value.trim());
      inputField.value = '';
    }
  });

  // Compose sidebar
  sidebar.appendChild(header);
  sidebar.appendChild(messagesArea);
  sidebar.appendChild(inputArea);

  // Close button handler
  const closeButton = sidebar.querySelector('.mprp-close');
  closeButton.addEventListener('click', () => {
    overlay.remove();
  });

  overlay.appendChild(sidebar);

  // API for updating messages
  return {
    overlay,
    panel: sidebar,
    setMessages: renderMessages,
    close: () => overlay.remove()
  };
}
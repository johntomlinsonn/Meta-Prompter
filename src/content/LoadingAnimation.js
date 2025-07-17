// LoadingAnimation.js
// Creates a loading animation component for when waiting for Cerebrus responses

/**
 * Creates a loading animation overlay with customizable message
 * @param {Object} options
 * @param {string} options.message - The loading message to display
 * @param {string} options.type - The type of loading ('questions', 'prompt', 'processing')
 * @returns {Object} { overlay, show, hide, updateMessage }
 */
export function createLoadingAnimation({ 
  message = 'Loading...', 
  type = 'processing' 
} = {}) {
  
  // Function to detect if the website has a dark theme
  function detectTheme() {
    const body = document.body;
    const html = document.documentElement;
    
    // Get computed styles
    const bodyStyles = window.getComputedStyle(body);
    const htmlStyles = window.getComputedStyle(html);
    
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
    
    // Get background colors
    const bodyBg = bodyStyles.backgroundColor;
    const htmlBg = htmlStyles.backgroundColor;
    
    // Calculate luminance
    let luminance = getLuminance(bodyBg) || getLuminance(htmlBg);
    
    // Check for common dark/light theme indicators
    const isDarkTheme = 
      body.classList.contains('dark') ||
      body.classList.contains('dark-theme') ||
      html.classList.contains('dark') ||
      html.classList.contains('dark-theme') ||
      bodyBg.includes('rgb(0') || bodyBg.includes('rgb(1') || bodyBg.includes('rgb(2');
    
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
      // Default to light theme if unable to determine
      isDark = false;
    }
    
    // Get the actual background color or use a default
    let bgColor = bodyBg;
    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
      bgColor = htmlBg;
    }
    if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
      bgColor = isDark ? 'rgb(33, 37, 41)' : 'rgb(255, 255, 255)';
    }
    
    return { isDark, bgColor };
  }
  
  const { isDark, bgColor } = detectTheme();
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'meta-prompt-loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;

  // Create loading container with glassmorphism effect
  const container = document.createElement('div');
  container.className = 'meta-prompt-loading-container';
  
  // Extract RGB values from background color to create glass effect
  const rgbMatch = bgColor.match(/\d+/g);
  let glassBackground;
  if (rgbMatch && rgbMatch.length >= 3) {
    const [r, g, b] = rgbMatch.map(x => parseInt(x));
    glassBackground = `rgba(${r}, ${g}, ${b}, 0.15)`;
  } else {
    glassBackground = isDark ? 'rgba(33, 37, 41, 0.15)' : 'rgba(255, 255, 255, 0.15)';
  }
  
  container.style.cssText = `
    background: ${glassBackground};
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    min-width: 280px;
    max-width: 400px;
    transform: scale(0.9) translateY(20px);
    transition: transform 0.3s ease;
  `;

  // Create animated icon based on type
  const iconContainer = document.createElement('div');
  iconContainer.className = 'meta-prompt-loading-icon';
  iconContainer.style.cssText = `
    width: 48px;
    height: 48px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Create spinning brain/gear icon for Cerebrus
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '48');
  svg.setAttribute('height', '48');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', isDark ? '#ffffff' : '#000000');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.style.cssText = `
    animation: meta-prompt-spin 2s linear infinite;
  `;

  // Different icons based on type
  if (type === 'questions') {
    svg.innerHTML = `
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    `;
  } else if (type === 'prompt') {
    svg.innerHTML = `
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    `;
  } else {
    // Default brain icon for processing
    svg.innerHTML = `
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
    `;
  }

  iconContainer.appendChild(svg);

  // Create pulsing dots animation
  const dotsContainer = document.createElement('div');
  dotsContainer.style.cssText = `
    display: flex;
    gap: 4px;
    margin-top: 8px;
  `;

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      background: ${isDark ? '#ffffff' : '#000000'};
      border-radius: 50%;
      animation: meta-prompt-pulse 1.4s ease-in-out infinite;
      animation-delay: ${i * 0.2}s;
    `;
    dotsContainer.appendChild(dot);
  }

  iconContainer.appendChild(dotsContainer);

  // Create message text
  const messageElement = document.createElement('div');
  messageElement.className = 'meta-prompt-loading-message';
  messageElement.textContent = message;
  messageElement.style.cssText = `
    font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: ${isDark ? '#ffffff' : '#000000'};
    text-align: center;
    line-height: 1.4;
    margin: 0;
  `;

  // Create subtitle based on type
  const subtitle = document.createElement('div');
  subtitle.className = 'meta-prompt-loading-subtitle';
  
  let subtitleText = '';
  switch (type) {
    case 'questions':
      subtitleText = 'Cerebrus is analyzing your prompt...';
      break;
    case 'prompt':
      subtitleText = 'Crafting your enhanced prompt...';
      break;
    default:
      subtitleText = 'Processing your request...';
  }
  
  subtitle.textContent = subtitleText;
  subtitle.style.cssText = `
    font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: ${isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'};
    text-align: center;
    margin: 0;
  `;

  // Assemble container
  container.appendChild(iconContainer);
  container.appendChild(messageElement);
  container.appendChild(subtitle);
  overlay.appendChild(container);

  // Add CSS animations to document if not already present
  if (!document.querySelector('#meta-prompt-loading-styles')) {
    const style = document.createElement('style');
    style.id = 'meta-prompt-loading-styles';
    style.textContent = `
      @keyframes meta-prompt-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes meta-prompt-pulse {
        0%, 80%, 100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      .meta-prompt-loading-overlay.visible {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      
      .meta-prompt-loading-overlay.visible .meta-prompt-loading-container {
        transform: scale(1) translateY(0) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // API methods
  const api = {
    overlay,
    
    show() {
      document.body.appendChild(overlay);
      // Force reflow
      overlay.offsetHeight;
      overlay.classList.add('visible');
    },
    
    hide() {
      overlay.classList.remove('visible');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    },
    
    updateMessage(newMessage, newSubtitle = null) {
      messageElement.textContent = newMessage;
      if (newSubtitle) {
        subtitle.textContent = newSubtitle;
      }
    },
    
    setType(newType) {
      type = newType;
      // Update icon based on new type with adaptive colors
      const strokeColor = isDark ? '#ffffff' : '#000000';
      svg.setAttribute('stroke', strokeColor);
      
      if (newType === 'questions') {
        svg.innerHTML = `
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        `;
        subtitle.textContent = 'Cerebrus is analyzing your prompt...';
      } else if (newType === 'prompt') {
        svg.innerHTML = `
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        `;
        subtitle.textContent = 'Crafting your enhanced prompt...';
      }
    }
  };

  return api;
}

/**
 * Convenience function to show loading for questions
 */
export function showQuestionsLoading() {
  return createLoadingAnimation({
    message: 'Generating questions to clarify your prompt',
    type: 'questions'
  });
}

/**
 * Convenience function to show loading for prompt generation
 */
export function showPromptLoading() {
  return createLoadingAnimation({
    message: 'Generating your new improved prompt',
    type: 'prompt'
  });
}

/**
 * Convenience function to show general processing loading
 */
export function showProcessingLoading(message = 'Processing...') {
  return createLoadingAnimation({
    message,
    type: 'processing'
  });
}

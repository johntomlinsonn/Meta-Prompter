// MetaPromptButton.js
// Exports a function to create the Meta-Prompt button DOM element

/**
 * Creates a Meta-Prompt button DOM element and attaches event listeners.
 * @param {HTMLElement} element - The input/textarea/contenteditable element the button is for.
 * @param {Function} onClick - Callback to execute when the button is clicked.
 * @returns {HTMLDivElement} The Meta-Prompt button element.
 */

export function createMetaPromptButton(element, onClick) {
  const button = document.createElement('div');
  button.className = 'meta-prompt-button';
  button.setAttribute('data-meta-prompt-button', 'true');

  // Add inline SVG pencil icon
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', '#444');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.style.display = 'block';
  svg.style.margin = 'auto';
  svg.innerHTML = `
    <path d="M12.3 6.7l5 5M3 21l3.75-1.07c.27-.08.52-.23.71-.43l10.6-10.6a2 2 0 0 0 0-2.83l-1.13-1.13a2 2 0 0 0-2.83 0L3.5 15.57c-.2.2-.35.45-.43.71L3 21z"/>
  `;
  button.appendChild(svg);

  // Add tooltip element
  const tooltip = document.createElement('div');
  tooltip.textContent = 'Improve prompt';
  tooltip.style.cssText = `
    position: absolute;
    left: 50%;
    top: -30px;
    transform: translateX(-50%);
    background: #fff;
    color: #222;
    padding: 4px 12px;
    border-radius: 5px;
    font-size: 13px;
    font-family: 'Inter', 'Segoe UI', 'Arial', sans-serif;
    font-weight: 500;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    z-index: 10001;
    box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    border: 1px solid #e0e0e0;
    letter-spacing: 0.01em;
  `;
  button.appendChild(tooltip);

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
    transition: border-color 0.2s, background 0.2s;
  `;
  // Store original styles to restore later
  let originalBackgroundColor = '';
  let originalColor = '';
  
  button.addEventListener('mouseenter', () => {
    button.style.background = '#e8f0fe';
    button.style.borderColor = '#4285f4';
    tooltip.style.opacity = '1';
    
    // Highlight the referenced text element with pastel yellow and black text
    if (element) {
      // Store the original styles if not already stored
      if (!originalBackgroundColor) {
        const computedStyle = window.getComputedStyle(element);
        originalBackgroundColor = computedStyle.backgroundColor;
      }
      element.style.transition = 'background-color 0.2s ease, color 0.2s ease';
      element.style.backgroundColor = '#fff9c488'; // Pastel yellow
    }
  });
  button.addEventListener('mouseleave', () => {
    button.style.background = '#fff';
    button.style.borderColor = '#d3e3fd';
    tooltip.style.opacity = '0';
    
    // Remove highlight from the referenced text element
    if (element) {
      element.style.backgroundColor = originalBackgroundColor || '';
      // Remove the transition after a short delay to prevent flickering
      setTimeout(() => {
        element.style.transition = '';
      }, 200);
    }
  });
  button.addEventListener('focus', () => {});
  button.addEventListener('blur', () => {});
  button.onclick = (e) => {
    e.stopPropagation();
    if (typeof onClick === 'function') {
      onClick();
    }
  };
  button.tabIndex = 0; // Make focusable
  return button;
} 
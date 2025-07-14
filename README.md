# Meta-Prompter

A Chrome extension that improves your prompts towards AI chatbots on any website!

## Features

- A button that automatically enhances prompts for AI chatbots
- Works on all AI platforms

## Project Structure

```
chrome-extension/
├── src/                       # Source code folder
│   ├── assets/                # Icons only for now
│   │   └── icons/             # Extension icons in various sizes
│   ├── background/            # Background scripts
│   │   └── background.js      # Main background script
│   ├── content/               # Content scripts
│   │   └── content.js         # Main content script
│   │   └── MetaPromptButon.js # Button to improve prompts
│   ├── popup/                 # Popup UI
│   │   ├── popup.html         # Popup HTML
│   │   ├── popup.css          # Popup styles
│   │   └── popup.js           # Popup logic
│   ├── options/               # Options page
│   │   ├── options.html       # Options page HTML
│   │   ├── options.css        # Options page styles
│   │   └── options.js         # Options page logic
│   └── utils/                 # Utility functions and helpers
│       └── helpers.js         # Common helper functions
├── dist/                      # Build output (generated)
├── manifest.json              # Extension manifest file
├── package.json               # NPM package configuration
└── webpack.config.js          # Webpack configuration
```

## Getting Started

### Prerequisites

- Node.js and npm installed
- Chrome browser

### Installation for Development

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the extension:
   ```
   npm run build
   ```
   For development with auto-reload:
   ```
   npm run dev
   ```
4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Usage

1. Click on the extension icon in your browser toolbar
2. Enable the extension using the toggle
3. Navigate to any AI chatbot website
4. Type your prompt in the text box
5. There will be a little white button on the right of a text-box that you can press to enhance your prompt

## License

MIT License

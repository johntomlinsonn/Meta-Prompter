# Meta-Prompter

A Chrome extension that edits any text box you're using to improve your prompt to an AI chatbot.

## Features

- Automatically enhances prompts for AI chatbots
- Works with popular AI platforms
- Customizable enhancement options
- Light and dark theme support

## Project Structure

```
chrome-extension/
├── src/                  # Source code folder
│   ├── assets/           # Images, icons, and other static assets
│   │   └── icons/        # Extension icons in various sizes
│   ├── background/       # Background scripts
│   │   └── background.js # Main background script
│   ├── content/          # Content scripts
│   │   └── content.js    # Main content script
│   ├── popup/            # Popup UI
│   │   ├── popup.html    # Popup HTML
│   │   ├── popup.css     # Popup styles
│   │   └── popup.js      # Popup logic
│   ├── options/          # Options page
│   │   ├── options.html  # Options page HTML
│   │   ├── options.css   # Options page styles
│   │   └── options.js    # Options page logic
│   └── utils/            # Utility functions and helpers
│       └── helpers.js    # Common helper functions
├── dist/                 # Build output (generated)
├── manifest.json         # Extension manifest file
├── package.json          # NPM package configuration
└── webpack.config.js     # Webpack configuration
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
5. The extension will automatically enhance your prompt

## Development

- `npm run dev`: Watch for file changes and rebuild
- `npm run build`: Build for production
- `npm run lint`: Lint the code
- `npm run test`: Run tests

## License

MIT License

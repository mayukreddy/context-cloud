# Context Cloud - Chrome Extension

A privacy-first Chrome extension that quietly remembers any text you copy or highlight, and injects the most relevant 2-3 lines of context into any textbox via a hotkey (Ctrl+Shift+.).

## Features

- **Privacy-First**: All data is stored locally and encrypted using AES-GCM
- **Smart Context Injection**: Uses vector embeddings to find the most relevant snippets
- **Hotkey Support**: Quick context injection with Ctrl+Shift+.
- **Modern UI**: Beautiful dark mode interface with premium design
- **Local Storage**: Uses IndexedDB with Dexie.js for efficient local storage
- **No Cloud Dependency**: Works entirely offline (except for optional embedding generation)

## Installation

### Development Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/mayukreddy/context-cloud.git
   cd context-cloud
   ```

2. **Configure your OpenAI API key:**
   ```bash
   cp config.example.js config.js
   ```
   Then edit `config.js` and add your OpenAI API key:
   ```javascript
   OPENAI_API_KEY: 'your-api-key-here'
   ```

3. Open Chrome/Edge and navigate to `chrome://extensions/`

4. Enable "Developer mode" in the top right

5. Click "Load unpacked" and select the `context-cloud` folder

6. The extension should now appear in your extensions list

### From Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once published.

## Usage

1. **Capture Snippets**: Simply highlight or copy any text on any webpage. The extension will automatically capture and store it.

2. **Inject Context**: When typing in any textbox, press `Ctrl+Shift+.` to inject the most relevant snippets.

3. **Manage Snippets**: Click the extension icon to open the popup where you can:
   - View all captured snippets
   - Search through snippets
   - Copy snippets to clipboard
   - Delete individual snippets
   - Erase all snippets

## Technical Architecture

### Core Components

- **Background Script** (`background.js`): Handles data storage, encryption, and message routing
- **Content Script** (`content.js`): Captures text selections and handles hotkey injection
- **Popup UI** (`popup.html/js`): User interface for managing snippets
- **Storage Layer** (`storage.js`): IndexedDB operations with Dexie.js
- **Embeddings** (`embeddings.js`): Vector search functionality

### Data Flow

1. **Capture**: Content script → Background script → Encrypted storage
2. **Retrieval**: Background script → Vector search → Relevant snippets
3. **Injection**: Content script → Textbox insertion

### Security

- All snippets are encrypted using AES-GCM before storage
- No data is sent to external servers (except for optional embedding generation)
- Local storage only - your data stays on your device
- API keys are kept local and not committed to version control

## Development

### Project Structure

```
context-cloud/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script
├── popup.html            # Popup UI
├── popup.js              # Popup logic
├── storage.js            # Database operations
├── embeddings.js         # Vector search
├── config.example.js     # Example configuration
├── config.js             # Your configuration (not in git)
├── dexie.min.js          # IndexedDB wrapper
└── icons/                # Extension icons
```

### Key Technologies

- **Vanilla JavaScript**: No build system required
- **Dexie.js**: IndexedDB wrapper for easier database operations
- **Web Crypto API**: For AES-GCM encryption
- **Vector Embeddings**: For semantic search (OpenAI or local models)

### Building for Production

1. Ensure all files are properly organized
2. Test the extension thoroughly
3. Create a ZIP file for Chrome Web Store submission

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### MVP (Current)
- ✅ Text capture and storage
- ✅ Hotkey injection
- ✅ Basic UI
- ✅ Local encryption

### Future Features
- [ ] Vector search for semantic relevance
- [ ] Cloud backup (optional)
- [ ] Proactive AI suggestions
- [ ] Enterprise features
- [ ] Cross-device sync
- [ ] Advanced filtering and tagging

## Privacy Policy

This extension:
- Stores all data locally on your device
- Does not collect or transmit personal information
- Uses encryption for all stored data
- Does not track your browsing activity
- Respects your privacy and data ownership

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/mayukreddy/context-cloud/issues) page
2. Create a new issue with detailed information
3. Include browser version and extension version

---

**Context Cloud** - Your personal context assistant, keeping your data private and your workflow efficient. 
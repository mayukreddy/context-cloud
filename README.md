# Context Cloud

A Chrome extension that remembers text you copy/highlight and injects relevant context into textboxes via hotkey (Ctrl+Shift+.).

## Features

- **Privacy-first**: All data stored locally and encrypted
- **Smart injection**: Uses AI to find relevant snippets
- **Hotkey**: Ctrl+Shift+. to inject context
- **Modern UI**: Clean, dark interface

## Quick Start

1. **Clone & setup:**
   ```bash
   git clone https://github.com/mayukreddy/context-cloud.git
   cd context-cloud
   cp config.example.js config.js
   # Edit config.js and add your OpenAI API key
   ```

2. **Load extension:**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → select folder

3. **Use:**
   - Highlight/copy text to capture
   - Press Ctrl+Shift+. in any textbox to inject context
   - Click extension icon to manage snippets

## Files

- `manifest.json` - Extension config
- `background.js` - Service worker
- `content.js` - Page interaction
- `popup.html/js` - UI
- `storage.js` - Database
- `embeddings.js` - AI search
- `config.js` - Your API key (not in git)

## Security

- API keys stay local (not committed)
- All data encrypted with AES-GCM
- No data sent to servers except OpenAI

## License

MIT License 
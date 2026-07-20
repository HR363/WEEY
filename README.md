# WEEY - AI-Powered Screen Analysis Overlay

A sleek, minimalist Electron overlay assistant inspired by Cluely. WEEY provides real-time screen analysis with AI, featuring a modern glassmorphic interface powered by Gemini (default) or Claude.

## Features

✨ **Cluely-Inspired Design**
- Modern glassmorphic UI with soft blue accents
- Minimal, clean interface
- Smooth animations and micro-interactions

🤖 **Dual AI Providers**
- **Gemini 2.0 Flash** (default) - Fast, multimodal analysis
- **Claude 3.5 Sonnet** - Alternative high-quality model

🎯 **Smart Overlay**
- Click-through by default (doesn't interfere with your work)
- Toggle interactive mode for settings
- Always-on-top window with OS-level screen capture exclusion

⌨️ **Customizable Hotkeys**
- Analyze screen: `Ctrl+Shift+Space`
- Toggle visibility: `Ctrl+Shift+H`
- Toggle interaction: `Ctrl+Shift+I`

🚀 **Lightweight**
- Built with React + Vite
- Minimal dependencies
- Fast startup and analysis

## Setup

### Prerequisites
- Node.js 16+
- macOS, Windows, or Linux

### Installation

```bash
# Clone the repository
git clone https://github.com/HR363/WEEY
cd WEEY

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory:

```env
# Required: Get from https://aistudio.google.com/apikey
VITE_GEMINI_API_KEY=AIza_your_key_here

# Optional: Get from https://console.anthropic.com/
VITE_ANTHROPIC_API_KEY=sk-ant-your_key_here

# Default provider
VITE_DEFAULT_PROVIDER=gemini
```

Or set API keys through the app's settings panel (enable interactive mode first).

## Usage

### Development

```bash
npm run dev
```

This starts the Vite dev server and Electron in development mode.

### Production Build

```bash
npm run build:renderer
npm start
```

### Hotkeys

- **Ctrl+Shift+Space** - Analyze current screen
- **Ctrl+Shift+H** - Show/hide overlay
- **Ctrl+Shift+I** - Toggle interactive mode (to access settings)

## How It Works

1. **Capture** - Takes a screenshot of your primary display
2. **Send** - Streams to Gemini or Claude with vision capabilities
3. **Analyze** - AI analyzes what's on screen and provides guidance
4. **Display** - Results stream in real-time in the overlay panel

## Settings

Enable interactive mode (Ctrl+Shift+I) to access:
- AI provider selection
- API key management
- Custom hotkey configuration
- Startup behavior

## Architecture

```
WEEY/
├── main.js              # Electron main process
├── preload.js           # IPC bridge
├── store.js             # Settings persistence
├── renderer/
│   ├── index.html
│   └── src/
│       ├── App.jsx      # React component
│       ├── main.jsx     # React entry
│       └── styles.css   # Glassmorphic design
├── package.json
└── vite.config.js
```

## API Keys

### Gemini API
1. Visit https://aistudio.google.com/apikey
2. Click "Get API Key"
3. Paste into WEEY settings

### Claude API
1. Visit https://console.anthropic.com/
2. Create API key in Account Settings
3. Paste into WEEY settings

## Troubleshooting

**Hotkeys not working:**
- Try different key combinations in settings
- Some systems reserve certain keys globally
- Enable interactive mode first

**No analysis appearing:**
- Check that API key is saved
- Verify internet connection
- Check API quota/billing

**Performance issues:**
- Reduce frequency of analysis
- Close other overlay applications
- Check system resources

## Design Inspiration

WEEY's interface takes inspiration from [Cluely](https://cluely.com/), featuring:
- Glassmorphic effects with backdrop blur
- Minimalist layout
- Blue accent colors
- Smooth micro-interactions
- Professional yet approachable aesthetic

## License

MIT

## Support

For issues and feature requests, visit: https://github.com/HR363/WEEY/issues

---

Built with ❤️ using React, Electron, and AI

# WEEY

AI-powered local Electron screen overlay assistant prototype.

## What this does

- Transparent, frameless, always-on-top overlay on the right side of the screen
- Overlay defaults to click-through mode (apps underneath remain fully interactive)
- Attempts OS-level capture exclusion using `BrowserWindow.setContentProtection(true)`
  - macOS: enables content protection
  - Windows: uses Electron's content protection mapping to display affinity exclusion
- Global hotkeys:
  - `Ctrl+Shift+Space`: capture primary screen and send to Claude vision model
  - `Ctrl+Shift+H`: show/hide overlay
  - `Ctrl+Shift+I`: toggle interaction mode (needed to click into overlay UI)
- Hotkeys are configurable in-app using Electron accelerator format
- Optional startup behavior: start minimized and register to launch at login
- Streams Claude response token-by-token into the overlay
- Stores API key and settings with `electron-store`


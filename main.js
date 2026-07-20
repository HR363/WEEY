const path = require('path');
const { app, BrowserWindow, globalShortcut, desktopCapturer, screen, ipcMain } = require('electron');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  getSettings,
  setApiKey,
  setOverlayVisible,
  setInteractiveMode,
  setSettings
} = require('./store');

let overlayWindow;
let isInteractive = false;
let activeHotkeys = {
  analyze: 'CommandOrControl+Shift+Space',
  visibility: 'CommandOrControl+Shift+H',
  interaction: 'CommandOrControl+Shift+I'
};

function getOverlayBounds() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const width = 420;
  const height = Math.max(360, workArea.height - 80);
  const x = workArea.x + workArea.width - width - 20;
  const y = workArea.y + 40;

  return { x, y, width, height };
}

function createOverlayWindow() {
  const bounds = getOverlayBounds();
  const settings = getSettings();
  const launchedMinimized = process.argv.includes('--minimized');

  overlayWindow = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    focusable: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // On macOS and Windows this enables OS-level screen capture exclusion.
  overlayWindow.setContentProtection(true);

  if (app.isPackaged) {
    overlayWindow.loadFile(path.join(__dirname, 'renderer', 'dist', 'index.html'));
  } else {
    overlayWindow.loadURL('http://localhost:5173');
  }

  if (launchedMinimized || settings.startMinimized || !settings.overlayVisible) {
    overlayWindow.hide();
  }

  setInteractiveState(false, false);

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function setInteractiveState(interactive, persist = true) {
  isInteractive = !!interactive;

  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  // Click-through by default, interactive only when explicitly toggled.
  overlayWindow.setIgnoreMouseEvents(!isInteractive, { forward: true });

  if (persist) {
    setInteractiveMode(isInteractive);
  }

  overlayWindow.webContents.send('overlay:interaction-mode', isInteractive);
}

function toggleOverlayVisibility() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  if (overlayWindow.isVisible()) {
    overlayWindow.hide();
    setOverlayVisible(false);
  } else {
    overlayWindow.showInactive();
    setOverlayVisible(true);
  }
}

async function capturePrimaryDisplayAsBase64Png() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const targetSize = primaryDisplay.size;

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: targetSize.width,
      height: targetSize.height
    },
    fetchWindowIcons: false
  });

  if (!sources || sources.length === 0) {
    throw new Error('No display source found for screenshot.');
  }

  const displayId = String(primaryDisplay.id);

  const source =
    sources.find((entry) => entry.display_id === displayId) ||
    sources.find((entry) => entry.name.toLowerCase().includes('screen')) ||
    sources[0];

  const pngBuffer = source.thumbnail.toPNG();

  if (!pngBuffer || pngBuffer.length === 0) {
    throw new Error('Failed to capture screenshot.');
  }

  return pngBuffer.toString('base64');
}

async function streamClaudeResponseWithScreenshot(base64Png) {
  const settings = getSettings();
  const apiKey = settings.apiKeys?.anthropic || settings.apiKey;

  if (!apiKey) {
    throw new Error('Claude API key not set. Open interactive mode and save your key first.');
  }

  const anthropic = new Anthropic({ apiKey });

  const stream = anthropic.messages.stream({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: "You are a concise AI assistant analyzing the user's screen. Provide brief, actionable insights.",
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Png
            }
          },
          {
            type: 'text',
            text: 'Analyze what is currently visible on screen and provide helpful concise guidance.'
          }
        ]
      }
    ]
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta &&
      event.delta.type === 'text_delta' &&
      event.delta.text
    ) {
      overlayWindow?.webContents.send('ai:token', event.delta.text);
    }
  }
}

async function streamGeminiResponseWithScreenshot(base64Png) {
  const settings = getSettings();
  const apiKey = settings.apiKeys?.gemini || settings.apiKey;

  if (!apiKey) {
    throw new Error('Gemini API key not set. Open interactive mode and save your key first.');
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContentStream([
    {
      text: "You are a concise AI assistant analyzing the user's screen. Analyze what is currently visible on screen and provide helpful concise guidance. Be brief and actionable."
    },
    {
      inlineData: {
        data: base64Png,
        mimeType: 'image/png'
      }
    }
  ]);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      overlayWindow?.webContents.send('ai:token', text);
    }
  }
}

async function streamProviderResponseWithScreenshot(base64Png) {
  const settings = getSettings();
  const provider = settings.provider || 'gemini';

  if (provider === 'anthropic') {
    await streamClaudeResponseWithScreenshot(base64Png);
    return;
  }

  await streamGeminiResponseWithScreenshot(base64Png);
}

async function runCaptureAnalyzeLoop() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  overlayWindow.showInactive();
  overlayWindow.webContents.send('ai:start');

  try {
    const base64Png = await capturePrimaryDisplayAsBase64Png();
    await streamProviderResponseWithScreenshot(base64Png);
    overlayWindow.webContents.send('ai:done');
  } catch (error) {
    overlayWindow.webContents.send(
      'ai:error',
      error && error.message ? error.message : 'Unknown error while processing screenshot.'
    );
  }
}

function registerHotkeys() {
  globalShortcut.unregisterAll();

  const settings = getSettings();
  const nextHotkeys = settings.hotkeys || activeHotkeys;

  const okAnalyze = globalShortcut.register(nextHotkeys.analyze, () => {
    runCaptureAnalyzeLoop();
  });

  const okVisibility = globalShortcut.register(nextHotkeys.visibility, () => {
    toggleOverlayVisibility();
  });

  const okInteraction = globalShortcut.register(nextHotkeys.interaction, () => {
    setInteractiveState(!isInteractive);
  });

  activeHotkeys = nextHotkeys;

  const failed = [];
  if (!okAnalyze) failed.push('analyze');
  if (!okVisibility) failed.push('visibility');
  if (!okInteraction) failed.push('interaction');

  if (failed.length > 0) {
    console.error(`Failed to register hotkeys: ${failed.join(', ')}`);
  }

  overlayWindow?.webContents.send('settings:hotkeys-active', activeHotkeys);

  return {
    ok: failed.length === 0,
    failed,
    activeHotkeys
  };
}

function applyLoginItemSettings(startMinimized) {
  app.setLoginItemSettings({
    openAtLogin: !!startMinimized,
    args: ['--minimized']
  });
}

function setupIpc() {
  ipcMain.handle('settings:get', () => {
    return getSettings();
  });

  ipcMain.handle('settings:set-api-key', (_event, provider, apiKey) => {
    setApiKey(provider, apiKey);
    return { ok: true };
  });

  ipcMain.handle('settings:update', (_event, nextSettings) => {
    setSettings(nextSettings || {});

    const updated = getSettings();
    applyLoginItemSettings(updated.startMinimized);
    const hotkeyResult = registerHotkeys();

    return {
      ok: true,
      settings: updated,
      hotkeys: hotkeyResult
    };
  });

  ipcMain.handle('overlay:set-interactive', (_event, interactive) => {
    setInteractiveState(!!interactive);
    return { interactive: isInteractive };
  });

  ipcMain.handle('overlay:get-interactive', () => {
    return { interactive: isInteractive };
  });

  ipcMain.handle('assistant:analyze-now', async () => {
    await runCaptureAnalyzeLoop();
    return { ok: true };
  });
}

app.whenReady().then(() => {
  const settings = getSettings();
  applyLoginItemSettings(settings.startMinimized);

  createOverlayWindow();
  setupIpc();
  registerHotkeys();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

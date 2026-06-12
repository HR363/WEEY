const Store = require('electron-store');

const store = new Store({
  name: 'weey-settings',
  defaults: {
    apiKey: '',
    overlayVisible: true,
    interactiveMode: false,
    startMinimized: false,
    hotkeys: {
      analyze: 'CommandOrControl+Shift+Space',
      visibility: 'CommandOrControl+Shift+H',
      interaction: 'CommandOrControl+Shift+I'
    }
  }
});

function getSettings() {
  return {
    apiKey: store.get('apiKey', ''),
    overlayVisible: store.get('overlayVisible', true),
    interactiveMode: store.get('interactiveMode', false),
    startMinimized: store.get('startMinimized', false),
    hotkeys: {
      analyze: store.get('hotkeys.analyze', 'CommandOrControl+Shift+Space'),
      visibility: store.get('hotkeys.visibility', 'CommandOrControl+Shift+H'),
      interaction: store.get('hotkeys.interaction', 'CommandOrControl+Shift+I')
    }
  };
}

function setApiKey(apiKey) {
  store.set('apiKey', apiKey || '');
}

function setOverlayVisible(visible) {
  store.set('overlayVisible', !!visible);
}

function setInteractiveMode(interactive) {
  store.set('interactiveMode', !!interactive);
}

function setSettings(nextSettings = {}) {
  if (typeof nextSettings.startMinimized === 'boolean') {
    store.set('startMinimized', nextSettings.startMinimized);
  }

  if (nextSettings.hotkeys && typeof nextSettings.hotkeys === 'object') {
    const current = getSettings().hotkeys;
    const merged = {
      analyze: nextSettings.hotkeys.analyze || current.analyze,
      visibility: nextSettings.hotkeys.visibility || current.visibility,
      interaction: nextSettings.hotkeys.interaction || current.interaction
    };
    store.set('hotkeys', merged);
  }
}

module.exports = {
  getSettings,
  setApiKey,
  setOverlayVisible,
  setInteractiveMode,
  setSettings
};

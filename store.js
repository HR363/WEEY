const Store = require('electron-store');

const store = new Store({
  defaults: {
    provider: 'gemini',
    apiKeys: {
      gemini: '',
      anthropic: ''
    },
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
  return store.store;
}

function setApiKey(provider, apiKey) {
  const current = store.get('apiKeys', {});
  store.set('apiKeys', {
    ...current,
    [provider]: apiKey
  });
  store.set('provider', provider);
}

function setOverlayVisible(visible) {
  store.set('overlayVisible', visible);
}

function setInteractiveMode(interactive) {
  store.set('interactiveMode', interactive);
}

function setSettings(settings) {
  if (settings.provider) {
    store.set('provider', settings.provider);
  }
  if (settings.apiKeys) {
    store.set('apiKeys', settings.apiKeys);
  }
  if (settings.apiKey) {
    store.set('apiKey', settings.apiKey);
  }
  if (settings.hotkeys) {
    store.set('hotkeys', settings.hotkeys);
  }
  if (typeof settings.startMinimized === 'boolean') {
    store.set('startMinimized', settings.startMinimized);
  }
}

module.exports = {
  getSettings,
  setApiKey,
  setOverlayVisible,
  setInteractiveMode,
  setSettings
};

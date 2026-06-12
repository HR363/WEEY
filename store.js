const Store = require('electron-store');

const store = new Store({
  name: 'weey-settings',
  defaults: {
    provider: 'anthropic',
    apiKey: '',
    apiKeys: {
      anthropic: '',
      gemini: ''
    },
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
    provider: store.get('provider', 'anthropic'),
    apiKey: store.get('apiKey', ''),
    apiKeys: {
      anthropic: store.get('apiKeys.anthropic', ''),
      gemini: store.get('apiKeys.gemini', '')
    },
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

function setApiKey(provider, apiKey) {
  const normalizedProvider = provider === 'gemini' ? 'gemini' : 'anthropic';
  store.set('provider', normalizedProvider);
  store.set('apiKey', apiKey || '');
  store.set(`apiKeys.${normalizedProvider}`, apiKey || '');
}

function setOverlayVisible(visible) {
  store.set('overlayVisible', !!visible);
}

function setInteractiveMode(interactive) {
  store.set('interactiveMode', !!interactive);
}

function setSettings(nextSettings = {}) {
  if (nextSettings.provider === 'anthropic' || nextSettings.provider === 'gemini') {
    store.set('provider', nextSettings.provider);
  }

  if (typeof nextSettings.startMinimized === 'boolean') {
    store.set('startMinimized', nextSettings.startMinimized);
  }

  if (nextSettings.apiKeys && typeof nextSettings.apiKeys === 'object') {
    if (typeof nextSettings.apiKeys.anthropic === 'string') {
      store.set('apiKeys.anthropic', nextSettings.apiKeys.anthropic);
    }

    if (typeof nextSettings.apiKeys.gemini === 'string') {
      store.set('apiKeys.gemini', nextSettings.apiKeys.gemini);
    }

    const currentProvider = store.get('provider', 'anthropic');
    const currentProviderKey = nextSettings.apiKeys[currentProvider];

    if (typeof currentProviderKey === 'string') {
      store.set('apiKey', currentProviderKey);
    }
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

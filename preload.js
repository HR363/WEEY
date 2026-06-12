const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlayApi', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setApiKey: (provider, apiKey) => ipcRenderer.invoke('settings:set-api-key', provider, apiKey),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),

  setInteractive: (interactive) => ipcRenderer.invoke('overlay:set-interactive', interactive),
  getInteractive: () => ipcRenderer.invoke('overlay:get-interactive'),

  analyzeNow: () => ipcRenderer.invoke('assistant:analyze-now'),

  onAiStart: (handler) => {
    const wrapped = () => handler();
    ipcRenderer.on('ai:start', wrapped);
    return () => ipcRenderer.removeListener('ai:start', wrapped);
  },

  onAiToken: (handler) => {
    const wrapped = (_event, token) => handler(token);
    ipcRenderer.on('ai:token', wrapped);
    return () => ipcRenderer.removeListener('ai:token', wrapped);
  },

  onAiDone: (handler) => {
    const wrapped = () => handler();
    ipcRenderer.on('ai:done', wrapped);
    return () => ipcRenderer.removeListener('ai:done', wrapped);
  },

  onAiError: (handler) => {
    const wrapped = (_event, message) => handler(message);
    ipcRenderer.on('ai:error', wrapped);
    return () => ipcRenderer.removeListener('ai:error', wrapped);
  },

  onInteractionMode: (handler) => {
    const wrapped = (_event, interactive) => handler(interactive);
    ipcRenderer.on('overlay:interaction-mode', wrapped);
    return () => ipcRenderer.removeListener('overlay:interaction-mode', wrapped);
  }
});

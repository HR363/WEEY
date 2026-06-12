import { useEffect, useMemo, useState } from 'react';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [interactive, setInteractive] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [startMinimized, setStartMinimized] = useState(false);
  const [hotkeys, setHotkeys] = useState({
    analyze: 'CommandOrControl+Shift+Space',
    visibility: 'CommandOrControl+Shift+H',
    interaction: 'CommandOrControl+Shift+I'
  });
  const [settingsStatus, setSettingsStatus] = useState('');
  const [output, setOutput] = useState('Waiting for hotkey: Ctrl+Shift+Space');

  useEffect(() => {
    let unsubscribeStart;
    let unsubscribeToken;
    let unsubscribeDone;
    let unsubscribeError;
    let unsubscribeInteractive;

    async function bootstrap() {
      const settings = await window.overlayApi.getSettings();
      const interactiveInfo = await window.overlayApi.getInteractive();
      setApiKey(settings.apiKey || '');
      setStartMinimized(!!settings.startMinimized);
      setHotkeys(
        settings.hotkeys || {
          analyze: 'CommandOrControl+Shift+Space',
          visibility: 'CommandOrControl+Shift+H',
          interaction: 'CommandOrControl+Shift+I'
        }
      );
      setInteractive(!!interactiveInfo.interactive);

      unsubscribeStart = window.overlayApi.onAiStart(() => {
        setStreaming(true);
        setOutput('');
      });

      unsubscribeToken = window.overlayApi.onAiToken((token) => {
        setOutput((prev) => prev + token);
      });

      unsubscribeDone = window.overlayApi.onAiDone(() => {
        setStreaming(false);
      });

      unsubscribeError = window.overlayApi.onAiError((message) => {
        setStreaming(false);
        setOutput(`Error: ${message}`);
      });

      unsubscribeInteractive = window.overlayApi.onInteractionMode((nextValue) => {
        setInteractive(!!nextValue);
      });
    }

    bootstrap();

    return () => {
      if (unsubscribeStart) unsubscribeStart();
      if (unsubscribeToken) unsubscribeToken();
      if (unsubscribeDone) unsubscribeDone();
      if (unsubscribeError) unsubscribeError();
      if (unsubscribeInteractive) unsubscribeInteractive();
    };
  }, []);

  const statusText = useMemo(() => {
    if (streaming) return 'Analyzing screen...';
    if (interactive) return 'Interactive mode ON (clickable)';
    return 'Click-through mode ON';
  }, [streaming, interactive]);

  const saveApiKey = async () => {
    await window.overlayApi.setApiKey(apiKey.trim());
    setSettingsStatus('API key saved.');
  };

  const saveBehaviorSettings = async () => {
    const result = await window.overlayApi.updateSettings({
      startMinimized,
      hotkeys
    });

    if (result?.hotkeys?.ok) {
      setSettingsStatus('Settings saved. Hotkeys active.');
      return;
    }

    const failed = result?.hotkeys?.failed || [];
    setSettingsStatus(`Saved, but some hotkeys failed: ${failed.join(', ') || 'unknown'}`);
  };

  const toggleInteractive = async () => {
    const result = await window.overlayApi.setInteractive(!interactive);
    setInteractive(!!result.interactive);
  };

  const analyzeNow = async () => {
    await window.overlayApi.analyzeNow();
  };

  const updateHotkey = (key, value) => {
    setHotkeys((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className={`panel ${interactive ? 'interactive' : ''}`}>
      <div className="header">
        <h1>WEEY</h1>
        <span className="status">{statusText}</span>
      </div>

      <div className="controls">
        <label htmlFor="api-key">Claude API Key</label>
        <input
          id="api-key"
          type="password"
          placeholder="sk-ant-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={!interactive}
        />

        <div className="row">
          <button onClick={saveApiKey} disabled={!interactive || streaming}>
            Save Key
          </button>
          <button onClick={toggleInteractive}>
            {interactive ? 'Enable Click-through' : 'Enable Interaction'}
          </button>
          <button onClick={analyzeNow} disabled={streaming}>
            Analyze Now
          </button>
        </div>

        <label htmlFor="hotkey-analyze">Analyze Hotkey (Electron accelerator)</label>
        <input
          id="hotkey-analyze"
          type="text"
          value={hotkeys.analyze}
          onChange={(e) => updateHotkey('analyze', e.target.value)}
          disabled={!interactive || streaming}
        />

        <label htmlFor="hotkey-visibility">Show/Hide Hotkey</label>
        <input
          id="hotkey-visibility"
          type="text"
          value={hotkeys.visibility}
          onChange={(e) => updateHotkey('visibility', e.target.value)}
          disabled={!interactive || streaming}
        />

        <label htmlFor="hotkey-interaction">Interaction Hotkey</label>
        <input
          id="hotkey-interaction"
          type="text"
          value={hotkeys.interaction}
          onChange={(e) => updateHotkey('interaction', e.target.value)}
          disabled={!interactive || streaming}
        />

        <label className="checkbox">
          <input
            type="checkbox"
            checked={startMinimized}
            onChange={(e) => setStartMinimized(e.target.checked)}
            disabled={!interactive || streaming}
          />
          Start minimized at login
        </label>

        <div className="row">
          <button onClick={saveBehaviorSettings} disabled={!interactive || streaming}>
            Save Settings
          </button>
        </div>

        {settingsStatus ? <div className="settings-status">{settingsStatus}</div> : null}
      </div>

      <div className="hotkeys">
        <div>Analyze: {hotkeys.analyze}</div>
        <div>Show/Hide: {hotkeys.visibility}</div>
        <div>Interaction: {hotkeys.interaction}</div>
      </div>

      <div className="output" aria-live="polite">
        {output || (streaming ? 'Streaming response...' : 'No response yet.')}
      </div>
    </div>
  );
}

export default App;

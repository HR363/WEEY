export {};

declare global {
  interface Window {
    overlayApi: {
      getSettings: () => Promise<{ apiKey: string; overlayVisible: boolean; interactiveMode: boolean }>;
      setApiKey: (apiKey: string) => Promise<{ ok: boolean }>;
      setInteractive: (interactive: boolean) => Promise<{ interactive: boolean }>;
      getInteractive: () => Promise<{ interactive: boolean }>;
      analyzeNow: () => Promise<{ ok: boolean }>;
      onAiStart: (handler: () => void) => () => void;
      onAiToken: (handler: (token: string) => void) => () => void;
      onAiDone: (handler: () => void) => () => void;
      onAiError: (handler: (message: string) => void) => () => void;
      onInteractionMode: (handler: (interactive: boolean) => void) => () => void;
    };
  }
}

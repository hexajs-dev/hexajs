import React, { useMemo, useState } from 'react';

const BrowserPlatform = Object.freeze({
  Chrome: 'chrome',
  Firefox: 'firefox',
  Safari: 'safari',
  Edge: 'edge',
  Opera: 'opera',
  Brave: 'brave',
  Unknown: 'unknown',
});

export default function App() {
  const [status, setStatus] = useState('idle');
  const platform = useMemo(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    switch (true) {
      case userAgent.includes('edg/'):
        return BrowserPlatform.Edge;
      case userAgent.includes('opr/') || userAgent.includes('opera'):
        return BrowserPlatform.Opera;
      case userAgent.includes('firefox/'):
        return BrowserPlatform.Firefox;
      case userAgent.includes('brave'):
        return BrowserPlatform.Brave;
      case userAgent.includes('safari/') && !userAgent.includes('chrome/') && !userAgent.includes('chromium/'):
        return BrowserPlatform.Safari;
      case userAgent.includes('chrome/') || userAgent.includes('chromium/'):
        return BrowserPlatform.Chrome;
      default:
        return BrowserPlatform.Unknown;
    }
  }, []);

  const onEmitToActiveTab = async () => {
    const message = {
      action: 'unmanaged-ui:emitToActiveTab',
      payload: {
        source: 'popup',
        platform,
        timestamp: Date.now(),
      },
    };

    try {
      setStatus('sending');

      switch (platform) {
        case BrowserPlatform.Firefox:
        case BrowserPlatform.Safari: {
          const runtime = globalThis.browser?.runtime ?? globalThis.chrome?.runtime;
          if (!runtime?.sendMessage) {
            setStatus('runtime-unavailable');
            return;
          }
          const response = await runtime.sendMessage(message);
          setStatus(`ok:${response?.status || 'sent'}`);
          return;
        }
        case BrowserPlatform.Chrome:
        case BrowserPlatform.Edge:
        case BrowserPlatform.Opera:
        case BrowserPlatform.Brave:
        default: {
          const runtime = globalThis.chrome?.runtime ?? globalThis.browser?.runtime;
          if (!runtime?.sendMessage) {
            setStatus('runtime-unavailable');
            return;
          }

          const response = await new Promise((resolve, reject) => {
            runtime.sendMessage(message, (result) => {
              const lastError = runtime.lastError;
              if (lastError) {
                reject(lastError);
                return;
              }
              resolve(result);
            });
          });

          setStatus(`ok:${response?.status || 'sent'}`);
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setStatus(`error:${reason}`);
    }
  };

  return (
    <main className="popup-app">
      <h1>HexaJS Popup</h1>
      <p>This popup sends a message to background, then background forwards it to the active tab.</p>
      <p>Detected platform: {platform}</p>
      <button type="button" onClick={onEmitToActiveTab}>
        Emit To Active Tab
      </button>
      <p>Status: {status}</p>
    </main>
  );
}

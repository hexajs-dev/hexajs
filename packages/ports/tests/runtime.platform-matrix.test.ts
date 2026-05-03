import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimePort } from '../src/general/runtime/runtime.port';

const promisePlatforms = ['firefox', 'safari'] as const;
const chromiumPlatforms = ['chrome', 'edge', 'opera', 'brave'] as const;

describe('RuntimePort platform matrix contracts', () => {
  afterEach(() => {
    delete (globalThis as any).chrome;
    delete (globalThis as any).browser;
    vi.restoreAllMocks();
  });

  describe.each(promisePlatforms)('%s promise-platform branch', (platform) => {
    it('uses browser runtime getURL and sendMessage APIs', async () => {
      const browserGetURL = vi.fn((targetPath?: string) => `browser://${targetPath || ''}`);
      const browserSendMessage = vi.fn().mockResolvedValue({ platform });
      const addListener = vi.fn();
      const removeListener = vi.fn();
      const addExternalListener = vi.fn();
      const removeExternalListener = vi.fn();
      const chromeSendMessage = vi.fn();

      (globalThis as any).browser = {
        runtime: {
          getURL: browserGetURL,
          sendMessage: browserSendMessage,
          onMessage: {
            addListener,
            removeListener,
          },
          onMessageExternal: {
            addListener: addExternalListener,
            removeListener: removeExternalListener,
          },
        },
      };
      (globalThis as any).chrome = {
        runtime: {
          sendMessage: chromeSendMessage,
        },
      };

      const runtimePort = new RuntimePort(platform);
      const response = await runtimePort.sendMessage({ target: platform });
      const url = runtimePort.getURL('assets/page.html');

      expect(response).toEqual({ platform });
      expect(url).toBe('browser://assets/page.html');
      expect(browserSendMessage).toHaveBeenCalledWith({ target: platform });
      expect(chromeSendMessage).not.toHaveBeenCalled();

      const callback = vi.fn().mockReturnValue(true);
      const dispose = runtimePort.onMessage(callback);
      const registered = addListener.mock.calls[0][0];
      const sendResponse = vi.fn();

      expect(registered({ type: 'ping' }, { id: 'sender' }, sendResponse)).toBe(true);
      expect(callback).toHaveBeenCalledWith({ type: 'ping' }, { id: 'sender' }, sendResponse);

      dispose();
      expect(removeListener).toHaveBeenCalledWith(registered);

      const externalCallback = vi.fn().mockReturnValue(true);
      const disposeExternal = runtimePort.onMessageExternal(externalCallback);
      const registeredExternal = addExternalListener.mock.calls[0][0];
      const sendExternalResponse = vi.fn();

      expect(registeredExternal({ type: 'external-ping' }, { id: 'external.app' }, sendExternalResponse)).toBe(true);
      expect(externalCallback).toHaveBeenCalledWith({ type: 'external-ping' }, { id: 'external.app' }, sendExternalResponse);

      disposeExternal();
      expect(removeExternalListener).toHaveBeenCalledWith(registeredExternal);
    });
  });

  describe.each(chromiumPlatforms)('%s chromium-platform branch', (platform) => {
    it('uses chrome runtime callback APIs even when browser global exists', async () => {
      const chromeRuntime: any = {
        lastError: undefined,
        getURL: vi.fn((targetPath?: string) => `chrome://${targetPath || ''}`),
        sendMessage: vi.fn((message: unknown, callback: (response?: unknown) => void) => {
          callback({ platform, ok: true });
        }),
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
        onMessageExternal: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      };
      const browserRuntime = {
        sendMessage: vi.fn().mockResolvedValue({ platform: 'browser-fallback' }),
      };

      (globalThis as any).chrome = { runtime: chromeRuntime };
      (globalThis as any).browser = { runtime: browserRuntime };

      const runtimePort = new RuntimePort(platform);
      const response = await runtimePort.sendMessage({ target: platform });
      const url = runtimePort.getURL('assets/page.html');

      expect(response).toEqual({ platform, ok: true });
      expect(url).toBe('chrome://assets/page.html');
      expect(chromeRuntime.sendMessage).toHaveBeenCalledWith({ target: platform }, expect.any(Function));
      expect(browserRuntime.sendMessage).not.toHaveBeenCalled();

      const callback = vi.fn().mockReturnValue(undefined);
      const dispose = runtimePort.onMessage(callback);
      const registered = chromeRuntime.onMessage.addListener.mock.calls[0][0];

      registered({ type: 'pong' }, { id: 'sender' }, vi.fn());
      expect(callback).toHaveBeenCalled();

      dispose();
      expect(chromeRuntime.onMessage.removeListener).toHaveBeenCalledWith(registered);

      const externalCallback = vi.fn().mockReturnValue(undefined);
      const disposeExternal = runtimePort.onMessageExternal(externalCallback);
      const registeredExternal = chromeRuntime.onMessageExternal.addListener.mock.calls[0][0];

      registeredExternal({ type: 'external-pong' }, { id: 'external.sender' }, vi.fn());
      expect(externalCallback).toHaveBeenCalled();

      disposeExternal();
      expect(chromeRuntime.onMessageExternal.removeListener).toHaveBeenCalledWith(registeredExternal);
    });
  });
});

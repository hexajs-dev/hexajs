import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimePort } from '../src/general/runtime/runtime.port';
import { StoragePort } from '../src/background/storage/storage.port';

describe('ports runtime and storage contracts', () => {
  afterEach(() => {
    delete (globalThis as any).chrome;
    delete (globalThis as any).browser;
    vi.restoreAllMocks();
  });

  it('uses Promise browser runtime sendMessage on firefox', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as any).browser = {
      runtime: {
        sendMessage,
      },
    };

    const runtimePort = new RuntimePort('firefox');
    const response = await runtimePort.sendMessage({ action: 'ping' });

    expect(sendMessage).toHaveBeenCalledWith({ action: 'ping' });
    expect(response).toEqual({ ok: true });
  });

  it('rejects on chrome runtime lastError in sendMessage', async () => {
    const runtimeError = new Error('runtime failure');
    const runtime: any = {
      lastError: undefined,
      sendMessage: vi.fn((message: unknown, callback: (response?: unknown) => void) => {
        runtime.lastError = runtimeError;
        callback(undefined);
      }),
    };

    (globalThis as any).chrome = { runtime };

    const runtimePort = new RuntimePort('chrome');

    await expect(runtimePort.sendMessage({ action: 'ping' })).rejects.toBe(runtimeError);
    expect(runtime.sendMessage).toHaveBeenCalledWith({ action: 'ping' }, expect.any(Function));
  });

  it('registers and removes runtime onMessage listeners', () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    (globalThis as any).chrome = {
      runtime: {
        onMessage: {
          addListener,
          removeListener,
        },
      },
    };

    const runtimePort = new RuntimePort('chrome');
    const callback = vi.fn();

    const dispose = runtimePort.onMessage(callback);

    const registeredListener = addListener.mock.calls[0][0];
    const sendResponse = vi.fn();
    registeredListener({ action: 'ping' }, { id: 'sender' }, sendResponse);

    expect(callback).toHaveBeenCalledWith({ action: 'ping' }, { id: 'sender' }, sendResponse);

    dispose();

    expect(removeListener).toHaveBeenCalledWith(registeredListener);
  });

  it('registers and removes runtime onMessageExternal listeners', () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    (globalThis as any).chrome = {
      runtime: {
        onMessageExternal: {
          addListener,
          removeListener,
        },
      },
    };

    const runtimePort = new RuntimePort('chrome');
    const callback = vi.fn().mockReturnValue(true);

    const dispose = runtimePort.onMessageExternal(callback);

    const registeredListener = addListener.mock.calls[0][0];
    const sendResponse = vi.fn();
    expect(registeredListener({ action: 'ping' }, { id: 'external.sender' }, sendResponse)).toBe(true);
    expect(callback).toHaveBeenCalledWith({ action: 'ping' }, { id: 'external.sender' }, sendResponse);

    dispose();

    expect(removeListener).toHaveBeenCalledWith(registeredListener);
  });

  it('throws clear error if runtime.reload API is unavailable', () => {
    (globalThis as any).chrome = { runtime: {} };

    const runtimePort = new RuntimePort('chrome');

    expect(() => runtimePort.reload()).toThrow('runtime.reload API not available in this context');
  });

  it('returns empty object when firefox storage.get resolves undefined', async () => {
    const get = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).browser = {
      storage: {
        local: {
          get,
        },
      },
    };

    const storagePort = new StoragePort('firefox');
    const result = await storagePort.get('local', null);

    expect(result).toEqual({});
    expect(get).toHaveBeenCalledWith(null);
  });

  it('rejects when chrome storage.set receives runtime.lastError', async () => {
    const runtimeError = new Error('quota exceeded');
    const runtime: any = { lastError: undefined };
    const set = vi.fn((items: Record<string, unknown>, callback: () => void) => {
      runtime.lastError = runtimeError;
      callback();
    });

    (globalThis as any).chrome = {
      runtime,
      storage: {
        local: {
          set,
        },
      },
    };

    const storagePort = new StoragePort('chrome');

    await expect(storagePort.set('local', { key: 'value' })).rejects.toBe(runtimeError);
    expect(set).toHaveBeenCalledWith({ key: 'value' }, expect.any(Function));
  });

  it('throws when storage.onChanged.addListener API is unavailable', () => {
    (globalThis as any).chrome = {
      storage: {},
    };

    const storagePort = new StoragePort('chrome');

    expect(() => storagePort.onChangedAddListener(vi.fn())).toThrow('storage.onChanged.addListener API not available in this context');
  });
});

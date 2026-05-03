import { afterEach, describe, expect, it, vi } from 'vitest';
import { RuntimePort } from '../src/general/runtime/runtime.port';

describe('RuntimePort callback and promise race behaviors', () => {
  afterEach(() => {
    delete (globalThis as any).chrome;
    delete (globalThis as any).browser;
    vi.restoreAllMocks();
  });

  it('resolves with the first callback response if callback is invoked multiple times', async () => {
    const chromeRuntime: any = {
      lastError: undefined,
      sendMessage: vi.fn((message: unknown, callback: (response?: unknown) => void) => {
        callback({ step: 1 });
        callback({ step: 2 });
      }),
    };

    (globalThis as any).chrome = { runtime: chromeRuntime };

    const runtimePort = new RuntimePort('chrome');
    const response = await runtimePort.sendMessage({ type: 'multi-callback' });

    expect(response).toEqual({ step: 1 });
    expect(chromeRuntime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('keeps sendMessage promise pending when callback is never invoked', async () => {
    const chromeRuntime = {
      lastError: undefined,
      sendMessage: vi.fn(),
    };

    (globalThis as any).chrome = { runtime: chromeRuntime };

    const runtimePort = new RuntimePort('chrome');
    let settled = false;

    runtimePort.sendMessage({ type: 'never-callback' }).then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(settled).toBe(false);
  });

  it('rejects with runtime.lastError in callback branch even when response exists', async () => {
    const runtimeError = new Error('lastError wins');
    const chromeRuntime: any = {
      lastError: undefined,
      sendMessage: vi.fn((message: unknown, callback: (response?: unknown) => void) => {
        chromeRuntime.lastError = runtimeError;
        callback({ ignored: true });
      }),
    };

    (globalThis as any).chrome = { runtime: chromeRuntime };

    const runtimePort = new RuntimePort('edge');

    await expect(runtimePort.sendMessage({ type: 'last-error' })).rejects.toBe(runtimeError);
  });

  it('rejects when runtime API is unavailable in chromium branch', async () => {
    (globalThis as any).chrome = {};

    const runtimePort = new RuntimePort('chrome');

    await expect(runtimePort.sendMessage({ type: 'missing-api' })).rejects.toThrow('runtime.sendMessage API not available in this context');
  });

  it('propagates browser promise rejection in firefox branch', async () => {
    (globalThis as any).browser = {
      runtime: {
        sendMessage: vi.fn().mockRejectedValue(new Error('promise failed')),
      },
    };

    const runtimePort = new RuntimePort('firefox');

    await expect(runtimePort.sendMessage({ type: 'promise-reject' })).rejects.toThrow('promise failed');
  });
});

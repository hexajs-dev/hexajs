import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkerEnvironment } from '../src/background/worker/decorators';

const transportMocks = vi.hoisted(() => ({
  ensureHostIsRunning: vi.fn(),
  executeMethod: vi.fn(),
}));

vi.mock('../src/background/worker/worker-transport', () => ({
  WorkerTransportEngine: {
    ensureHostIsRunning: transportMocks.ensureHostIsRunning,
    executeMethod: transportMocks.executeMethod,
  },
}));

import { createWorkerProxy, withWorkerEvents } from '../src/background/worker/worker-proxy';

describe('worker lifecycle hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses one boot promise for concurrent calls on the same proxy', async () => {
    let resolveBoot: (() => void) | null = null;
    const bootPromise = new Promise<void>((resolve) => {
      resolveBoot = resolve;
    });

    transportMocks.ensureHostIsRunning.mockReturnValue(bootPromise);
    transportMocks.executeMethod
      .mockResolvedValueOnce('first-result')
      .mockResolvedValueOnce('second-result');

    const worker = createWorkerProxy('ocr-worker', WorkerEnvironment.DOM) as {
      recognize: (input: string) => Promise<string>;
    };

    const firstCall = worker.recognize('a');
    const secondCall = worker.recognize('b');

    expect(transportMocks.ensureHostIsRunning).toHaveBeenCalledTimes(1);

    resolveBoot?.();

    await expect(Promise.all([firstCall, secondCall])).resolves.toEqual(['first-result', 'second-result']);
    expect(transportMocks.executeMethod).toHaveBeenNthCalledWith(1, 'ocr-worker', 'recognize', ['a'], undefined);
    expect(transportMocks.executeMethod).toHaveBeenNthCalledWith(2, 'ocr-worker', 'recognize', ['b'], undefined);
  });

  it('keeps rejecting calls when host boot fails and does not execute worker methods', async () => {
    transportMocks.ensureHostIsRunning.mockRejectedValue(new Error('boot failed'));
    transportMocks.executeMethod.mockResolvedValue('should-not-run');

    const worker = createWorkerProxy('ocr-worker', WorkerEnvironment.DOM) as {
      recognize: (input: string) => Promise<string>;
    };

    await expect(worker.recognize('first')).rejects.toThrow('boot failed');
    await expect(worker.recognize('second')).rejects.toThrow('boot failed');

    expect(transportMocks.ensureHostIsRunning).toHaveBeenCalledTimes(1);
    expect(transportMocks.executeMethod).not.toHaveBeenCalled();
  });

  it('passes bound event handlers to executeMethod for streaming events', async () => {
    const onEvent = vi.fn();
    transportMocks.ensureHostIsRunning.mockResolvedValue(undefined);
    transportMocks.executeMethod.mockResolvedValue('ok');

    const proxy = createWorkerProxy('ocr-worker', WorkerEnvironment.DOM);
    const worker = withWorkerEvents(proxy, onEvent) as {
      recognize: (input: string) => Promise<string>;
    };

    const result = await worker.recognize('payload');

    expect(result).toBe('ok');
    expect(transportMocks.executeMethod).toHaveBeenCalledWith('ocr-worker', 'recognize', ['payload'], onEvent);
  });
});

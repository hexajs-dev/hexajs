import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('worker transport bootstrapping', () => {
  const originalWorker = (globalThis as any).Worker;

  const resetTransportState = async (): Promise<any> => {
    const actual = await vi.importActual<typeof import('../src/background/worker/worker-transport')>('../src/background/worker/worker-transport');
    const transport = actual.WorkerTransportEngine as any;
    transport.hostReady = null;
    transport.workerInstance = null;
    transport.pendingCalls = new Map();
    transport.callId = 0;
    return transport;
  };

  beforeEach(async () => {
    await resetTransportState();
  });

  afterEach(() => {
    (globalThis as any).Worker = originalWorker;
  });

  it('fails with a clear error when Worker API is unavailable', async () => {
    const transport = await resetTransportState();
    (globalThis as any).Worker = undefined;

    await expect(transport.ensureHostIsRunning(WorkerEnvironment.Compute)).rejects.toThrow(
      'Web Worker API is not available in this background runtime'
    );
  });

  it('falls back to classic worker constructor when module workers are unsupported', async () => {
    const constructorCalls: Array<{ scriptPath: string; options?: { type: 'module' } }> = [];

    class WorkerMock {
      onmessage: ((event: any) => void) | null = null;

      constructor(scriptPath: string, options?: { type: 'module' }) {
        constructorCalls.push({ scriptPath, options });
        if (options?.type === 'module') {
          throw new Error('module workers are not supported');
        }
      }

      postMessage(_payload: any): void {}
    }

    (globalThis as any).Worker = WorkerMock;
    const transport = await resetTransportState();

    await expect(transport.ensureHostIsRunning(WorkerEnvironment.Compute)).resolves.toBeUndefined();
    expect(constructorCalls.length).toBeGreaterThanOrEqual(2);
    expect(constructorCalls[0]?.options).toEqual({ type: 'module' });
    expect(constructorCalls[1]?.options).toBeUndefined();
  });
});

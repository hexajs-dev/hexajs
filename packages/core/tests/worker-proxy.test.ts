import { describe, expect, it, vi } from 'vitest';
import { WorkerEnvironment } from '../src/background/worker/decorators';

const transportMocks = vi.hoisted(() => ({
  ensureHostIsRunning: vi.fn().mockResolvedValue(undefined),
  executeMethod: vi.fn().mockResolvedValue('ok'),
}));

vi.mock('../src/background/worker/worker-transport', () => ({
  WorkerTransportEngine: {
    ensureHostIsRunning: transportMocks.ensureHostIsRunning,
    executeMethod: transportMocks.executeMethod,
  },
}));

import { createWorkerProxy, withWorkerEvents } from '../src/background/worker/worker-proxy';

describe('worker proxy', () => {
  it('binds event handlers to worker calls', async () => {
    const onEvent = vi.fn();
    const proxy = createWorkerProxy('ocr-worker', WorkerEnvironment.DOM);
    const worker = withWorkerEvents(proxy, onEvent) as { recognize: (imageDataUrl: string) => Promise<string> };

    const result = await worker.recognize('image-data');

    expect(result).toBe('ok');
    expect(transportMocks.ensureHostIsRunning).toHaveBeenCalledWith(WorkerEnvironment.DOM);
    expect(transportMocks.executeMethod).toHaveBeenCalledWith('ocr-worker', 'recognize', ['image-data'], onEvent);
  });

  it('returns original value when binding non-worker instances', () => {
    const target = { recognize: vi.fn() };
    expect(withWorkerEvents(target, vi.fn())).toBe(target);
  });
});
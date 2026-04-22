/**
 * Event emitted from a worker while a proxied worker method is executing.
 *
 * @typeParam T Application-defined payload carried in `data`.
 */
export interface WorkerCallEvent<T = unknown> {
  /** Unique identifier of the in-flight worker call that emitted this event. */
  callId: string;
  /** Worker name declared in `@Worker({ name: ... })`. */
  workerName: string;
  /** Event discriminator chosen by the worker implementation, for example `ocr-progress`. */
  eventType: string;
  /** Optional event payload supplied by the worker implementation. */
  data?: T;
}

interface ActiveWorkerCallContext {
  callId: string;
  workerName: string;
}

const ACTIVE_WORKER_CALL_KEY = '__HEXA_ACTIVE_WORKER_CALL__';

function getActiveWorkerCallContext(): ActiveWorkerCallContext | null {
  const context = (globalThis as Record<string, unknown>)[ACTIVE_WORKER_CALL_KEY];
  if (!context || typeof context !== 'object') {
    return null;
  }

  const value = context as { callId?: unknown; workerName?: unknown };
  if (typeof value.callId !== 'string' || typeof value.workerName !== 'string') {
    return null;
  }

  return { callId: value.callId, workerName: value.workerName };
}

/**
 * Emits a host-visible event from the currently executing worker call.
 *
 * Use this inside a worker method to stream progress, status updates, or other
 * intermediate signals back to the host code that wrapped the proxy with
 * {@link withWorkerEvents}.
 *
 * @param eventType Application-defined event name.
 * @param data Optional serializable payload associated with the event.
 *
 * @example
 * emitWorkerEvent('ocr-progress', { progress: 50, stage: 'recognizing' });
 */
export function emitWorkerEvent<T = unknown>(eventType: string, data?: T): void {
  const activeCall = getActiveWorkerCallContext();
  if (!activeCall) {
    return;
  }

  const message: WorkerCallEvent<T> & { type: string } = {
    type: 'HEXA_WORKER_EVENT',
    callId: activeCall.callId,
    workerName: activeCall.workerName,
    eventType,
    data,
  };

  const chromeApi = (globalThis as any).chrome;
  if (chromeApi?.runtime?.sendMessage) {
    chromeApi.runtime.sendMessage(message);
    return;
  }

  if (typeof (globalThis as any).postMessage === 'function') {
    (globalThis as any).postMessage(message);
  }
}
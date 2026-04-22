import { WorkerEnvironment } from './decorators';
import { WorkerCallEvent } from './events';
import { WorkerTransportEngine } from './worker-transport';

const BIND_WORKER_EVENTS = '__hexa_bind_worker_events__';

function createBoundWorkerProxy(workerName: string, environment: WorkerEnvironment, onEvent?: (event: WorkerCallEvent) => void): any {
  let bootPromise: Promise<void> | null = null;

  return new Proxy({}, {
    get(_target: any, prop: string | symbol) {
      if (prop === 'then') return undefined;
      if (typeof prop === 'symbol') return undefined;
      if (prop === BIND_WORKER_EVENTS) {
        return (handler: (event: WorkerCallEvent) => void) => createBoundWorkerProxy(workerName, environment, handler);
      }

      return async (...args: any[]) => {
        if (!bootPromise) {
          bootPromise = WorkerTransportEngine.ensureHostIsRunning(environment);
        }
        await bootPromise;
        return WorkerTransportEngine.executeMethod(workerName, prop, args, onEvent);
      };
    },
  });
}

export function createWorkerProxy(workerName: string, environment: WorkerEnvironment): any {
  return createBoundWorkerProxy(workerName, environment);
}

/**
 * Binds a listener to a worker proxy so host code can receive streaming events
 * emitted from inside the worker via {@link emitWorkerEvent}.
 *
 * The returned value keeps the same callable worker surface. Worker methods
 * still resolve their final Promise result as usual; this only adds event
 * notifications while the call is in flight.
 *
 * Typical usage is to inspect `event.eventType` and then narrow `event.data`
 * to the payload shape for that event.
 *
 * @param workerProxy Worker proxy created by the HexaJS worker runtime.
 * @param onEvent Callback invoked whenever the worker emits an event for the
 * current in-flight call.
 * @returns A worker proxy with the same public method surface as `workerProxy`.
 *
 * @example
 * const worker = withWorkerEvents(ocrWorker, (event) => {
 *   if (event.eventType !== 'ocr-progress' || !event.data || typeof event.data !== 'object') {
 *     return;
 *   }
 *
 *   console.log(event.data);
 * });
 *
 * const result = await worker.recognize(imageDataUrl);
 *
 * @remarks
 * - Events are delivered asynchronously while the worker method is running.
 * - `event.callId` and `event.workerName` identify the emitting call.
 * - `event.data` is the application-defined payload from `emitWorkerEvent()`.
 */
export function withWorkerEvents<T extends object>(workerProxy: T, onEvent: (event: WorkerCallEvent) => void): T {
  const bindEvents = (workerProxy as Record<string, unknown>)[BIND_WORKER_EVENTS];
  if (typeof bindEvents !== 'function') {
    return workerProxy;
  }

  return bindEvents(onEvent) as T;
}

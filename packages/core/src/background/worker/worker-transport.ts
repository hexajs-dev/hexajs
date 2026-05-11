import { inject } from '@hexajs-dev/common';
import { RuntimePort } from '@hexajs-dev/ports';
import { WorkerEnvironment } from './decorators';
import { WorkerCallEvent } from './events';

declare const __HEXA_PLATFORM__: string | undefined;

const PlatformType = {
  Chrome: 'chrome',
  Edge: 'edge',
  Opera: 'opera',
  Brave: 'brave',
  Firefox: 'firefox',
  Safari: 'safari',
} as const;

const OFFSCREEN_PAGE_CANDIDATES = ['background/hexa-offscreen.html', 'hexa-offscreen.html'] as const;
const WORKER_SCRIPT_CANDIDATES = ['background/hexa.worker.js', 'hexa.worker.js'] as const;
const WORKER_CONSTRUCTOR_CANDIDATES: Array<{ type: 'module' } | undefined> = [{ type: 'module' }, undefined];

export class WorkerTransportEngine {
  private static hostReady: Promise<void> | null = null;
  private static workerInstance: any = null;
  private static pendingCalls = new Map<string, { resolve: (v: any) => void; reject: (e: any) => void; onEvent?: (event: WorkerCallEvent) => void }>();
  private static callId = 0;

  static async ensureHostIsRunning(environment: WorkerEnvironment): Promise<void> {
    if (this.hostReady) return this.hostReady;

    this.hostReady = this.boot(environment);
    return this.hostReady;
  }

  private static async boot(environment: WorkerEnvironment): Promise<void> {
    const platform = typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : undefined;

    if (environment === WorkerEnvironment.DOM) {
      switch (platform) {
        case PlatformType.Chrome:
        case PlatformType.Edge:
        case PlatformType.Opera:
        case PlatformType.Brave: {
          const chromeApi = (globalThis as any).chrome;
          if (chromeApi?.offscreen) {
            const hasDoc = await chromeApi.offscreen.hasDocument();
            if (!hasDoc) {
              let created = false;
              let lastError: unknown;
              for (const pagePath of OFFSCREEN_PAGE_CANDIDATES) {
                try {
                  await chromeApi.offscreen.createDocument({
                    url: pagePath,
                    reasons: ['WORKERS'],
                    justification: 'HexaJS Worker execution',
                  });
                  created = true;
                  break;
                } catch (error) {
                  lastError = error;
                }
              }

              if (!created && lastError) {
                throw lastError;
              }
            }
          }
          this.setupRuntimeMessageRelay();
          return;
        }
        case PlatformType.Firefox: {
          this.bootWebWorker();
          return;
        }
        case PlatformType.Safari: {
          this.bootWebWorker();
          return;
        }
        default: {
          this.setupRuntimeMessageRelay();
          return;
        }
      }
    }

    this.bootWebWorker();
  }

  private static bootWebWorker(): void {
    if (this.workerInstance) return;

    const WorkerCtor = (globalThis as any).Worker;
    if (typeof WorkerCtor !== 'function') {
      throw new Error('[HexaJS] Web Worker API is not available in this background runtime. DOM workers require a worker-capable background context.');
    }

    let worker: any = null;
    let lastError: unknown;

    for (const scriptPath of WORKER_SCRIPT_CANDIDATES) {
      for (const constructorOptions of WORKER_CONSTRUCTOR_CANDIDATES) {
        try {
          worker = constructorOptions ? new WorkerCtor(scriptPath, constructorOptions) : new WorkerCtor(scriptPath);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (worker) {
        break;
      }
    }

    if (!worker) {
      const reason = lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown error');
      throw new Error(`[HexaJS] Failed to initialize worker host using scripts (${WORKER_SCRIPT_CANDIDATES.join(', ')}): ${reason}`);
    }

    this.workerInstance = worker;
    this.workerInstance.onmessage = (event: any) => {
      if (event.data?.type === 'HEXA_WORKER_EVENT') {
        this.dispatchWorkerEvent(event.data);
        return;
      }

      const { callId, success, data, error } = event.data;
      const pending = this.pendingCalls.get(callId);
      if (pending) {
        this.pendingCalls.delete(callId);
        if (success) {
          pending.resolve(data);
        } else {
          pending.reject(new Error(error ?? 'Worker execution failed'));
        }
      }
    };
  }

  private static setupRuntimeMessageRelay(): void {
    const runtimePort = inject(RuntimePort);
    runtimePort.onMessage((message: any, _sender: any, sendResponse: any) => {
      if (message?.type === 'HEXA_WORKER_EVENT') {
        this.dispatchWorkerEvent(message);
        return false;
      }

      if (message?.type === 'HEXA_WORKER_RESPONSE') {
        const { callId, success, data, error } = message;
        const pending = this.pendingCalls.get(callId);
        if (pending) {
          this.pendingCalls.delete(callId);
          if (success) {
            pending.resolve(data);
          } else {
            pending.reject(new Error(error ?? 'Worker execution failed'));
          }
        }
      }
      return false;
    });
  }

  private static dispatchWorkerEvent(message: WorkerCallEvent): void {
    const pending = this.pendingCalls.get(message.callId);
    pending?.onEvent?.(message);
  }

  static async executeMethod(workerName: string, method: string, args: any[], onEvent?: (event: WorkerCallEvent) => void): Promise<any> {
    const callId = `hexa_wc_${++this.callId}`;

    return new Promise((resolve, reject) => {
      this.pendingCalls.set(callId, { resolve, reject, onEvent });

      const payload = {
        type: 'HEXA_WORKER_CALL',
        callId,
        workerName,
        method,
        args,
      };

      if (this.workerInstance) {
        this.workerInstance.postMessage(payload);
      } else {
        const runtimePort = inject(RuntimePort);
        runtimePort.sendMessage(payload)
          .then((response: any) => {
            this.pendingCalls.delete(callId);
            if (response?.success) {
              resolve(response.data);
              return;
            }

            reject(new Error(response?.error ?? 'Worker execution failed'));
          })
          .catch((err: Error) => {
            this.pendingCalls.delete(callId);
            reject(err);
          });
      }
    });
  }
}

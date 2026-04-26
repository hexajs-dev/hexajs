import { RuntimePort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';
import { HexaPipeValidationError } from '../../services/hexa-client.base';
import { HexaPipeRunner } from '../../services/hexa-pipe-runner';

// TODO we should use webExt that eventually will have all browsers types
export type BackgroundHandlerFn = (payload: any, sender: unknown) => any | Promise<any>;

@Injectable({ context: InjectableContext.Background })
export class ControllerContainer {
    // Unicast: Action/Handle (1:1)
    private unicastHandlers = new Map<string, BackgroundHandlerFn>();

    // Multicast: On (1:N)
    private multicastHandlers = new Map<string, BackgroundHandlerFn[]>();

    private pipeRunner: HexaPipeRunner | null = null;
    private listenerCleanup: (() => void) | null = null;

    constructor(private runtimePort: RuntimePort) {
        this.initializeListener();
    }

    public setPipeRunner(runner: HexaPipeRunner) {
        this.pipeRunner = runner;
    }

    public destroy(): void {
        this.listenerCleanup?.();
        this.listenerCleanup = null;
        this.unicastHandlers.clear();
        this.multicastHandlers.clear();
        this.pipeRunner = null;
    }

    /**
       * Called by the Bootstrap Generator
       */
    public registerUnicast(name: string, handler: BackgroundHandlerFn) {
        if (this.unicastHandlers.has(name)) {
            throw new Error(`HexaJS: Duplicate Unicast handler for "${name}"`);
        }
        this.unicastHandlers.set(name, handler);
    }

    public registerMulticast(name: string, handler: BackgroundHandlerFn) {
        const handlers = this.multicastHandlers.get(name) || [];
        handlers.push(handler);
        this.multicastHandlers.set(name, handlers);
    }


    /**
   * The Central Switchboard
   */
    private initializeListener() {
        this.listenerCleanup = this.runtimePort.onMessage((message, sender, sendResponse) => {
            const { action, event, payload } = message;
            // Handle incoming messages and route them to appropriate controllers
            // 1. Handle Unicast (@Action)
            if (action && this.unicastHandlers.has(action)) {
                const handler = this.unicastHandlers.get(action)!;

                // We wrap in Promise.resolve to handle both sync and async methods
                const validatePayload = this.pipeRunner
                    ? this.pipeRunner.runInboundPipes({ route: action, payload, sender, context: 'background' })
                    : Promise.resolve(payload);

                Promise.resolve(validatePayload)
                    .then(validPayload => handler(validPayload, sender))
                    .then(result => this.pipeRunner
                        ? this.pipeRunner.runOutboundPipes({ route: action, payload: result, sender, context: 'background' })
                        : result)
                    .then(result => sendResponse(result))
                    .catch(error => {
                        console.error(`[HexaJS][Background][Unicast] "${action}" failed`, error);
                        sendResponse(this.toErrorPayload(error));
                    });

                return true; // Keep the message channel open for the async response
            }

            // 2. Handle Multicast (@On)
            if (event && this.multicastHandlers.has(event)) {
                const handlers = this.multicastHandlers.get(event)!;

                const validatePayload = this.pipeRunner
                    ? this.pipeRunner.runInboundPipes({ route: event, payload, sender, context: 'background' })
                    : Promise.resolve(payload);

                Promise.resolve(validatePayload)
                    .then(validPayload => Promise.all(
                        handlers.map(h => Promise.resolve().then(() => h(validPayload, sender)))
                    ))
                    .catch(error => {
                        console.error(`[HexaJS][Background][Multicast] "${event}" failed`, error);
                    });
                return;
            }
        });
    }

    private toErrorPayload(error: unknown): { __hexa_error__: string; __hexa_code__?: string; __hexa_details__?: unknown } {
        if (error instanceof HexaPipeValidationError) {
            return {
                __hexa_error__: error.message,
                __hexa_code__: error.code,
                __hexa_details__: error.details
            };
        }

        if (error instanceof Error) {
            return { __hexa_error__: error.message };
        }

        return { __hexa_error__: 'Unknown handler error' };
    }
}
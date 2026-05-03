import { RuntimePort } from '@hexajs-dev/ports';
import { HexaContext, Injectable } from '@hexajs-dev/common';
import type { HexaMessageBoundaryPolicy } from '@hexajs-dev/common';
import { HexaPipeValidationError } from '../../services/hexa-client.base';
import { evaluateMessageBoundaryPolicy } from '../../services/message-boundary';
import { HexaPipeRunner } from '../../services/hexa-pipe-runner';


// TODO we should use webExt that eventually will have all browsers types
export type ContentHandlerFn = (payload: any, sender: unknown) => any | Promise<any>;
const DEFAULT_BOUNDARY_POLICY: Readonly<HexaMessageBoundaryPolicy> = Object.freeze({ mode: 'internal-only' });

@Injectable({ context: HexaContext.Background })
export class HandlerContainer {
    // Unicast: Action/Handle (1:1)
    private unicastHandlers = new Map<string, ContentHandlerFn>();
    private unicastPolicies = new Map<string, Readonly<HexaMessageBoundaryPolicy>>();

    // Multicast: On (1:N)
    private multicastHandlers = new Map<string, ContentHandlerFn[]>();
    private multicastPolicies = new Map<string, Readonly<HexaMessageBoundaryPolicy>>();

    private pipeRunner: HexaPipeRunner | null = null;

    private listenerCleanup: (() => void) | null = null;

    constructor(private runtimePort: RuntimePort) {
        this.initializeListener();
    }

    public setPipeRunner(runner: HexaPipeRunner) {
        this.pipeRunner = runner;
    }

    /**
     * Destroys the handler container:
     * - Removes the runtime message listener
     * - Clears all registered handlers
     * - Resets piped client
     */
    public destroy(): void {
        // Remove the message listener
        this.listenerCleanup?.();
        this.listenerCleanup = null;

        // Clear handler maps
        this.unicastHandlers.clear();
        this.unicastPolicies.clear();
        this.multicastHandlers.clear();
        this.multicastPolicies.clear();

        // Reset pipe runner
        this.pipeRunner = null;
    }

    /**
       * Called by the Bootstrap Generator
       */
    public registerUnicast(name: string, handler: ContentHandlerFn, policy: Readonly<HexaMessageBoundaryPolicy> = DEFAULT_BOUNDARY_POLICY) {
        if (this.unicastHandlers.has(name)) {
            throw new Error(`HexaJS: Duplicate Unicast handler for "${name}"`);
        }
        this.unicastHandlers.set(name, handler);
        this.unicastPolicies.set(name, policy);
    }

    public registerMulticast(name: string, handler: ContentHandlerFn, policy: Readonly<HexaMessageBoundaryPolicy> = DEFAULT_BOUNDARY_POLICY) {
        const handlers = this.multicastHandlers.get(name) || [];
        handlers.push(handler);
        this.multicastHandlers.set(name, handlers);
        if (!this.multicastPolicies.has(name)) {
            this.multicastPolicies.set(name, policy);
        }
    }


    /**
   * The Central Switchboard
   */
    private initializeListener() {
        this.listenerCleanup = this.runtimePort.onMessage((message, sender, sendResponse) => {
            const { action, event, payload } = message || {};
            // Handle incoming messages and route them to appropriate controllers
            // 1. Handle Unicast (@Handle)
            if (action && this.unicastHandlers.has(action)) {
                const policy = this.unicastPolicies.get(action) ?? DEFAULT_BOUNDARY_POLICY;
                const boundary = evaluateMessageBoundaryPolicy(policy, sender, 'internal');
                if (!boundary.allowed) {
                    sendResponse(this.toPolicyDeniedPayload(action, policy, boundary));
                    return true;
                }

                const handler = this.unicastHandlers.get(action)!;

                // We wrap in Promise.resolve to handle both sync and async methods
                const validatePayload = this.pipeRunner
                    ? this.pipeRunner.runInboundPipes({ route: action, payload, sender, context: 'content' })
                    : Promise.resolve(payload);

                Promise.resolve(validatePayload)
                    .then(validPayload => handler(validPayload, sender))
                    .then(result => this.pipeRunner
                        ? this.pipeRunner.runOutboundPipes({ route: action, payload: result, sender, context: 'content' })
                        : result)
                    .then(result => sendResponse(result))
                    .catch(error => {
                        console.error(`[HexaJS][Content][Unicast] "${action}" failed`, error);
                        sendResponse(this.toErrorPayload(error));
                    });

                return true; // Keep the message channel open for the async response
            }

            // 2. Handle Multicast (@Subscribe)
            if (event && this.multicastHandlers.has(event)) {
                const policy = this.multicastPolicies.get(event) ?? DEFAULT_BOUNDARY_POLICY;
                const boundary = evaluateMessageBoundaryPolicy(policy, sender, 'internal');
                if (!boundary.allowed) {
                    console.warn(`[HexaJS][Content][Multicast] "${event}" blocked by boundary policy`, {
                        policy,
                        senderId: boundary.senderId,
                        senderOrigin: boundary.senderOrigin,
                    });
                    return;
                }

                const handlers = this.multicastHandlers.get(event)!;

                const validatePayload = this.pipeRunner
                    ? this.pipeRunner.runInboundPipes({ route: event, payload, sender, context: 'content' })
                    : Promise.resolve(payload);

                Promise.resolve(validatePayload)
                    .then(validPayload => Promise.all(
                        handlers.map(h => Promise.resolve().then(() => h(validPayload, sender)))
                    ))
                    .catch(error => {
                        console.error(`[HexaJS][Content][Multicast] "${event}" failed`, error);
                    });
                return;
            }
        });
    }

    private toPolicyDeniedPayload(route: string, policy: Readonly<HexaMessageBoundaryPolicy>, boundary: { senderId?: string; senderOrigin?: string }): { __hexa_error__: string; __hexa_code__: string; __hexa_details__: unknown } {
        return {
            __hexa_error__: 'Message sender is not allowed by route boundary policy',
            __hexa_code__: 'HEXA_BOUNDARY_POLICY_DENIED',
            __hexa_details__: {
                route,
                policy,
                senderId: boundary.senderId,
                senderOrigin: boundary.senderOrigin,
            },
        };
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
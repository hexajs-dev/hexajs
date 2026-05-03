import { RuntimePort } from '@hexajs-dev/ports';
import { HexaContext, Injectable } from '@hexajs-dev/common';
import type { HexaMessageBoundaryPolicy } from '@hexajs-dev/common';
import { HexaPipeValidationError } from '../../services/hexa-client.base';
import { evaluateMessageBoundaryPolicy, MessageChannel } from '../../services/message-boundary';
import { HexaPipeRunner } from '../../services/hexa-pipe-runner';

// TODO we should use webExt that eventually will have all browsers types
export type BackgroundHandlerFn = (payload: any, sender: unknown) => any | Promise<any>;
const DEFAULT_BOUNDARY_POLICY: Readonly<HexaMessageBoundaryPolicy> = Object.freeze({ mode: 'internal-only' });

@Injectable({ context: HexaContext.Background })
export class ControllerContainer {
    // Unicast: Action/Handle (1:1)
    private unicastHandlers = new Map<string, BackgroundHandlerFn>();
    private unicastPolicies = new Map<string, Readonly<HexaMessageBoundaryPolicy>>();
    private externalUnicastRoutes = new Set<string>();

    // Multicast: On (1:N)
    private multicastHandlers = new Map<string, BackgroundHandlerFn[]>();
    private multicastPolicies = new Map<string, Readonly<HexaMessageBoundaryPolicy>>();
    private externalMulticastRoutes = new Set<string>();

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
        this.unicastPolicies.clear();
        this.externalUnicastRoutes.clear();
        this.multicastHandlers.clear();
        this.multicastPolicies.clear();
        this.externalMulticastRoutes.clear();
        this.pipeRunner = null;
    }

    /**
       * Called by the Bootstrap Generator
       */
    public registerUnicast(
        name: string,
        handler: BackgroundHandlerFn,
        policy: Readonly<HexaMessageBoundaryPolicy> = DEFAULT_BOUNDARY_POLICY,
        externalSubscribed: boolean = policy.mode === 'allow-external'
    ) {
        if (this.unicastHandlers.has(name)) {
            throw new Error(`HexaJS: Duplicate Unicast handler for "${name}"`);
        }
        this.unicastHandlers.set(name, handler);
        this.unicastPolicies.set(name, policy);
        if (externalSubscribed) {
            this.externalUnicastRoutes.add(name);
        } else {
            this.externalUnicastRoutes.delete(name);
        }
    }

    public registerMulticast(
        name: string,
        handler: BackgroundHandlerFn,
        policy: Readonly<HexaMessageBoundaryPolicy> = DEFAULT_BOUNDARY_POLICY,
        externalSubscribed: boolean = policy.mode === 'allow-external'
    ) {
        const handlers = this.multicastHandlers.get(name) || [];
        handlers.push(handler);
        this.multicastHandlers.set(name, handlers);
        if (!this.multicastPolicies.has(name)) {
            this.multicastPolicies.set(name, policy);
        }
        if (externalSubscribed) {
            this.externalMulticastRoutes.add(name);
        }
    }


    /**
   * The Central Switchboard
   */
    private initializeListener() {
        const internalCleanup = this.runtimePort.onMessage((message, sender, sendResponse) => {
            return this.handleIncomingMessage(message, sender, sendResponse, 'internal');
        });

        let externalCleanup: (() => void) | null = null;
        const runtimeWithExternal = this.runtimePort as RuntimePort & {
            onMessageExternal?: (callback: (message: any, sender: unknown, sendResponse: (response?: any) => void) => boolean | void) => () => void;
        };

        if (typeof runtimeWithExternal.onMessageExternal === 'function') {
            try {
                externalCleanup = runtimeWithExternal.onMessageExternal((message, sender, sendResponse) => {
                    return this.handleIncomingMessage(message, sender, sendResponse, 'external');
                });
            } catch (error) {
                console.warn('[HexaJS][Background] runtime.onMessageExternal listener unavailable, external boundary checks disabled for this runtime.', error);
            }
        }

        this.listenerCleanup = () => {
            internalCleanup?.();
            externalCleanup?.();
        };
    }

    private handleIncomingMessage(message: any, sender: unknown, sendResponse: (response?: any) => void, channel: MessageChannel): boolean | void {
        const { action, event, payload } = message || {};

        if (action && this.unicastHandlers.has(action)) {
            if (channel === 'external' && !this.externalUnicastRoutes.has(action)) {
                return;
            }

            const policy = this.unicastPolicies.get(action) ?? DEFAULT_BOUNDARY_POLICY;
            const boundary = evaluateMessageBoundaryPolicy(policy, sender, channel);
            if (!boundary.allowed) {
                sendResponse(this.toPolicyDeniedPayload(action, policy, boundary));
                return true;
            }

            const handler = this.unicastHandlers.get(action)!;
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

            return true;
        }

        if (event && this.multicastHandlers.has(event)) {
            if (channel === 'external' && !this.externalMulticastRoutes.has(event)) {
                return;
            }

            const policy = this.multicastPolicies.get(event) ?? DEFAULT_BOUNDARY_POLICY;
            const boundary = evaluateMessageBoundaryPolicy(policy, sender, channel);
            if (!boundary.allowed) {
                console.warn(`[HexaJS][Background][Multicast] "${event}" blocked by boundary policy`, {
                    channel,
                    policy,
                    senderId: boundary.senderId,
                    senderOrigin: boundary.senderOrigin,
                });
                return;
            }

            const handlers = this.multicastHandlers.get(event)!;
            const validatePayload = this.pipeRunner
                ? this.pipeRunner.runInboundPipes({ route: event, payload, sender, context: 'background' })
                : Promise.resolve(payload);

            Promise.resolve(validatePayload)
                .then(validPayload => Promise.all(handlers.map(handler => Promise.resolve().then(() => handler(validPayload, sender)))))
                .catch(error => {
                    console.error(`[HexaJS][Background][Multicast] "${event}" failed`, error);
                });
            return;
        }
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
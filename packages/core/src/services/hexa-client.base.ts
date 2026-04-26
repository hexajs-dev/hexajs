import { RuntimePort } from '@hexajs-dev/ports';

export type HexaPipeContextName = 'background' | 'content';

export interface HexaPipeInput {
    route: string;
    payload: unknown;
    sender: unknown;
    context: HexaPipeContextName;
}

export interface HexaPipeValidationResult {
    valid: boolean;
    error?: string;
    code?: string;
    details?: unknown;
}

export type HexaPipeFn = (input: HexaPipeInput) => unknown | HexaPipeValidationResult | Promise<unknown | HexaPipeValidationResult>;

export class HexaPipeValidationError extends Error {
    public readonly code: string;
    public readonly details?: unknown;

    constructor(message: string, code: string = 'HEXA_VALIDATION_FAILED', details?: unknown) {
        super(message);
        this.name = 'HexaPipeValidationError';
        this.code = code;
        this.details = details;
    }
}

/**
 * Base HexaClient — context-agnostic messaging primitives.
 * Extend this in background and content service variants.
 */
export abstract class HexaClientBase {

    constructor(protected readonly runtimePort: RuntimePort) { }

    /**
     * Send a message and await a response.
     * Content → background uses runtime.sendMessage.
     * Background → content requires a tabId — use BackgroundHexaClient.sendToTab().
     * @param target Routing key in `namespace:action` format (e.g. `'namespace:action\handle\on\subscribe'`).
     * @param payload Optional payload to send with the message.
     */
    async sendMessage<TPayload, TResponse>(target: `${string}:${string}`, payload?: TPayload): Promise<TResponse> {
        return this.runtimePort.sendMessage({ action: target, payload });
    }

}
import { RuntimePort } from '@hexajs-dev/ports';

export type HexaPipeContextName = 'background' | 'content';
type HexaValidationErrorCode = 'HEXA_VALIDATION_FAILED' | 'HEXA_RESPONSE_VALIDATION_FAILED';

interface HexaErrorPayload {
    __hexa_error__: string;
    __hexa_code__?: string;
    __hexa_details__?: unknown;
}

function isHexaErrorPayload(value: unknown): value is HexaErrorPayload {
    return !!value && typeof value === 'object' && '__hexa_error__' in value && typeof (value as { __hexa_error__: unknown }).__hexa_error__ === 'string';
}

function isHexaValidationErrorPayload(value: unknown): value is HexaErrorPayload & { __hexa_code__: HexaValidationErrorCode } {
    return isHexaErrorPayload(value) && (value.__hexa_code__ === 'HEXA_VALIDATION_FAILED' || value.__hexa_code__ === 'HEXA_RESPONSE_VALIDATION_FAILED');
}

function normalizeHexaResponseOrThrow<TResponse>(value: unknown): TResponse {
    if (isHexaValidationErrorPayload(value)) {
        throw new HexaRemoteError(value);
    }

    return value as TResponse;
}

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

export class HexaRemoteError extends Error {
    public readonly code?: string;
    public readonly details?: unknown;

    constructor(payload: { __hexa_error__: string; __hexa_code__?: string; __hexa_details__?: unknown }) {
        super(payload.__hexa_error__);
        this.name = 'HexaRemoteError';
        this.code = payload.__hexa_code__;
        this.details = payload.__hexa_details__;
    }
}

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

    protected normalizeResponseOrThrow<TResponse>(value: unknown): TResponse {
        return normalizeHexaResponseOrThrow<TResponse>(value);
    }

    /**
     * Send a message and await a response.
     * Content → background uses runtime.sendMessage.
     * Background → content requires a tabId — use BackgroundHexaClient.sendToTab().
     * @param target Routing key in `namespace:action` format (e.g. `'namespace:action\handle\on\subscribe'`).
     * @param payload Optional payload to send with the message.
     */
    async sendMessage<TPayload, TResponse>(target: `${string}:${string}`, payload?: TPayload): Promise<TResponse> {
        const response = await this.runtimePort.sendMessage({ action: target, payload });
        return this.normalizeResponseOrThrow<TResponse>(response);
    }

}

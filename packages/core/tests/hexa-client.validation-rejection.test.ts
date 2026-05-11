import { describe, expect, it, vi } from 'vitest';
import { RuntimePort, TabsPort } from '@hexajs-dev/ports';
import { HexaBackgroundClient } from '../src/background/services/hexa-background-client.service';
import { HexaClientBase, HexaRemoteError } from '../src/services/hexa-client.base';

interface HexaTransportErrorPayload {
    __hexa_error__: string;
    __hexa_code__?: string;
    __hexa_details__?: unknown;
}

class TestHexaClient extends HexaClientBase {
    constructor(runtimePort: RuntimePort) {
        super(runtimePort);
    }
}

async function captureHexaRemoteError(execution: () => Promise<unknown>): Promise<HexaRemoteError> {
    try {
        await execution();
        throw new Error('Expected a HexaRemoteError to be thrown');
    } catch (error) {
        expect(error).toBeInstanceOf(HexaRemoteError);
        return error as HexaRemoteError;
    }
}

describe('Hexa client validation rejection behavior', () => {
    it('rejects sendMessage with inbound validation payload errors as HexaRemoteError', async () => {
        const validationError: HexaTransportErrorPayload = {
            __hexa_error__: 'requestedAt must be a number',
            __hexa_code__: 'HEXA_VALIDATION_FAILED',
            __hexa_details__: { field: 'requestedAt' }
        };

        const runtimePort = {
            sendMessage: vi.fn().mockResolvedValue(validationError)
        } as unknown as RuntimePort;

        const client = new TestHexaClient(runtimePort);
        const payload = { requestedAt: 'not-a-number' };

        const caught = await captureHexaRemoteError(() => client.sendMessage<typeof payload, { ok: true }>('config:get', payload));

        expect(caught).toBeInstanceOf(HexaRemoteError);
        expect(caught.name).toBe('HexaRemoteError');
        expect(caught.message).toBe('requestedAt must be a number');
        expect(caught.code).toBe('HEXA_VALIDATION_FAILED');
        expect(caught.details).toEqual({ field: 'requestedAt' });
        expect((caught as unknown as { __hexa_error__?: unknown }).__hexa_error__).toBeUndefined();
        expect((runtimePort as unknown as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith({ action: 'config:get', payload });
    });

    it('rejects sendMessage with outbound validation payload errors as HexaRemoteError', async () => {
        const responseValidationError: HexaTransportErrorPayload = {
            __hexa_error__: 'response has unknown properties',
            __hexa_code__: 'HEXA_RESPONSE_VALIDATION_FAILED',
            __hexa_details__: { extraKeys: ['extra'] }
        };

        const runtimePort = {
            sendMessage: vi.fn().mockResolvedValue(responseValidationError)
        } as unknown as RuntimePort;

        const client = new TestHexaClient(runtimePort);

        const caught = await captureHexaRemoteError(() => client.sendMessage<unknown, { ok: true }>('config:get', {}));

        expect(caught).toBeInstanceOf(HexaRemoteError);
        expect(caught.message).toBe('response has unknown properties');
        expect(caught.code).toBe('HEXA_RESPONSE_VALIDATION_FAILED');
        expect(caught.details).toEqual({ extraKeys: ['extra'] });
    });

    it('does not reject sendMessage for non-validation Hexa error payloads', async () => {
        const boundaryPayload: HexaTransportErrorPayload = {
            __hexa_error__: 'Message sender is not allowed by route boundary policy',
            __hexa_code__: 'HEXA_BOUNDARY_POLICY_DENIED',
            __hexa_details__: { route: 'security:ping' }
        };

        const runtimePort = {
            sendMessage: vi.fn().mockResolvedValue(boundaryPayload)
        } as unknown as RuntimePort;

        const client = new TestHexaClient(runtimePort);

        await expect(client.sendMessage<unknown, HexaTransportErrorPayload>('security:ping', {})).resolves.toEqual(boundaryPayload);
    });

    it('rejects sendToTab with validation payload errors as HexaRemoteError', async () => {
        const validationError: HexaTransportErrorPayload = {
            __hexa_error__: 'content must not be empty',
            __hexa_code__: 'HEXA_VALIDATION_FAILED',
            __hexa_details__: { field: 'content' }
        };

        const tabsPort = {
            sendTabMessage: vi.fn().mockResolvedValue(validationError),
            broadcastMessage: vi.fn().mockResolvedValue(undefined)
        } as unknown as TabsPort;

        const client = new HexaBackgroundClient({} as RuntimePort, tabsPort);

        const caught = await captureHexaRemoteError(() => client.sendToTab<unknown, { ok: true }>(15, 'clip:add', {}));

        expect(caught).toBeInstanceOf(HexaRemoteError);
        expect(caught.message).toBe('content must not be empty');
        expect(caught.code).toBe('HEXA_VALIDATION_FAILED');
        expect(caught.details).toEqual({ field: 'content' });
        expect((tabsPort as unknown as { sendTabMessage: ReturnType<typeof vi.fn> }).sendTabMessage).toHaveBeenCalledWith(15, { action: 'clip:add', payload: {} });
    });

    it('does not reject sendToTab for non-validation Hexa error payloads', async () => {
        const nonValidationPayload: HexaTransportErrorPayload = {
            __hexa_error__: 'Message sender is not allowed by route boundary policy',
            __hexa_code__: 'HEXA_BOUNDARY_POLICY_DENIED',
            __hexa_details__: { route: 'security:handle' }
        };

        const tabsPort = {
            sendTabMessage: vi.fn().mockResolvedValue(nonValidationPayload),
            broadcastMessage: vi.fn().mockResolvedValue(undefined)
        } as unknown as TabsPort;

        const client = new HexaBackgroundClient({} as RuntimePort, tabsPort);

        await expect(client.sendToTab<unknown, HexaTransportErrorPayload>(12, 'security:handle', {})).resolves.toEqual(nonValidationPayload);
    });

    it('keeps standard Error contract for caught remote exceptions', async () => {
        const validationError: HexaTransportErrorPayload = {
            __hexa_error__: 'invalid payload',
            __hexa_code__: 'HEXA_VALIDATION_FAILED',
            __hexa_details__: { field: 'name' }
        };

        const runtimePort = {
            sendMessage: vi.fn().mockResolvedValue(validationError)
        } as unknown as RuntimePort;

        const client = new TestHexaClient(runtimePort);
        const caught = await captureHexaRemoteError(() => client.sendMessage<unknown, { ok: true }>('profile:update', {}));

        expect(caught).toBeInstanceOf(Error);
        expect(caught.message).toBe('invalid payload');
        expect(caught.code).toBe('HEXA_VALIDATION_FAILED');
        expect(caught.details).toEqual({ field: 'name' });
    });
});

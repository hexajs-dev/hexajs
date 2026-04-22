/// <reference types="vitest/globals" />

import { firstValueFrom } from 'rxjs';
import { HttpHexaClient, HttpHexaClientError, HttpHexaClientResponseLike } from '../src/services/http-hexa-client.service';

interface MockResponseOptions {
    ok?: boolean;
    status?: number;
    statusText?: string;
    url?: string;
    body?: unknown;
    text?: string;
    headers?: Record<string, string>;
}

const runtimeGlobal = globalThis as typeof globalThis & { fetch?: (...args: unknown[]) => Promise<HttpHexaClientResponseLike> };

function createResponse(options: MockResponseOptions = {}): HttpHexaClientResponseLike {
    const body = options.body;
    const text = options.text ?? (body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body));
    const headers = options.headers ?? {};

    return {
        ok: options.ok ?? true,
        status: options.status ?? 200,
        statusText: options.statusText ?? 'OK',
        url: options.url ?? 'https://api.test/resource',
        headers: {
            forEach(callback: (value: string, key: string) => void) {
                Object.entries(headers).forEach(([key, value]) => callback(value, key));
            }
        },
        text: async () => text,
        json: async () => body,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => body,
        formData: async () => body,
    };
}

describe('HttpHexaClient', () => {
    const originalFetch = runtimeGlobal.fetch;

    afterEach(() => {
        vi.restoreAllMocks();
        runtimeGlobal.fetch = originalFetch;
    });

    it('issues GET requests with serialized params and headers', async () => {
        const client = new HttpHexaClient();
        const fetchMock = vi.fn().mockResolvedValue(createResponse({ body: { ok: true } }));

        runtimeGlobal.fetch = fetchMock;

        const result = await firstValueFrom(client.get<{ ok: boolean }>('https://api.test/items', {
            params: { search: 'hexa', page: 2, tags: ['core', 'ui'] },
            headers: { authorization: 'Bearer token' }
        }));

        expect(result).toEqual({ ok: true });
        expect(fetchMock).toHaveBeenCalledWith('https://api.test/items?search=hexa&page=2&tags=core&tags=ui', {
            method: 'GET',
            headers: { authorization: 'Bearer token' }
        });
    });

    it('serializes object bodies as JSON for post requests', async () => {
        const client = new HttpHexaClient();
        const fetchMock = vi.fn().mockResolvedValue(createResponse({ body: { created: true } }));

        runtimeGlobal.fetch = fetchMock;

        const result = await firstValueFrom(client.post<{ created: boolean }, { name: string }>('https://api.test/items', { name: 'Hexa' }));

        expect(result).toEqual({ created: true });
        expect(fetchMock).toHaveBeenCalledWith('https://api.test/items', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'Hexa' })
        });
    });

    it('supports text responses', async () => {
        const client = new HttpHexaClient();
        const fetchMock = vi.fn().mockResolvedValue(createResponse({ text: 'plain-text-response' }));

        runtimeGlobal.fetch = fetchMock;

        const result = await firstValueFrom(client.get<string>('https://api.test/message', { responseType: 'text' }));

        expect(result).toBe('plain-text-response');
    });

    it('throws HttpHexaClientError for non-ok responses', async () => {
        const client = new HttpHexaClient();
        const fetchMock = vi.fn().mockResolvedValue(createResponse({
            ok: false,
            status: 422,
            statusText: 'Unprocessable Entity',
            body: { error: 'validation_failed' },
            headers: { 'x-request-id': 'req-1' }
        }));

        runtimeGlobal.fetch = fetchMock;

        await expect(firstValueFrom(client.post('https://api.test/items', { name: '' }))).rejects.toMatchObject<HttpHexaClientError>({
            name: 'HttpHexaClientError',
            status: 422,
            statusText: 'Unprocessable Entity',
            body: { error: 'validation_failed' },
            headers: { 'x-request-id': 'req-1' }
        });
    });

    it('propagates fetch rejections', async () => {
        const client = new HttpHexaClient();
        const expectedError = new Error('network failed');
        const fetchMock = vi.fn().mockRejectedValue(expectedError);

        runtimeGlobal.fetch = fetchMock;

        await expect(firstValueFrom(client.get('https://api.test/items'))).rejects.toBe(expectedError);
    });
});
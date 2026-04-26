import { Injectable } from '@hexajs-dev/common';
import { Observable, defer, from } from 'rxjs';

export type HttpHexaClientMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type HttpHexaClientResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
export type HttpHexaClientPrimitive = string | number | boolean;
export type HttpHexaClientHeaderValue = HttpHexaClientPrimitive | readonly HttpHexaClientPrimitive[];
export type HttpHexaClientQueryValue = HttpHexaClientPrimitive | readonly HttpHexaClientPrimitive[] | null | undefined;
export type HttpHexaClientHeaders = Record<string, HttpHexaClientHeaderValue>;
export type HttpHexaClientParams = Record<string, HttpHexaClientQueryValue>;
export type HttpHexaClientCredentials = 'omit' | 'same-origin' | 'include';
export type HttpHexaClientMode = 'cors' | 'navigate' | 'no-cors' | 'same-origin';
export type HttpHexaClientCache = 'default' | 'force-cache' | 'no-cache' | 'no-store' | 'only-if-cached' | 'reload';
export type HttpHexaClientRedirect = 'error' | 'follow' | 'manual';

export interface HttpHexaClientHeadersLike {
    forEach?(callback: (value: string, key: string) => void): void;
    entries?(): Iterable<[string, string]>;
}

export interface HttpHexaClientResponseLike {
    ok: boolean;
    status: number;
    statusText: string;
    url?: string;
    headers?: HttpHexaClientHeadersLike | Record<string, string>;
    text?(): Promise<string>;
    json?(): Promise<unknown>;
    blob?(): Promise<unknown>;
    arrayBuffer?(): Promise<unknown>;
    formData?(): Promise<unknown>;
}

export interface HttpHexaClientRequestOptions<TBody = unknown> {
    body?: TBody;
    headers?: HttpHexaClientHeaders;
    params?: HttpHexaClientParams;
    responseType?: HttpHexaClientResponseType;
    withCredentials?: boolean;
    credentials?: HttpHexaClientCredentials;
    mode?: HttpHexaClientMode;
    cache?: HttpHexaClientCache;
    redirect?: HttpHexaClientRedirect;
    referrer?: string;
    integrity?: string;
    keepalive?: boolean;
    signal?: unknown;
}

export type HttpHexaClientQueryRequestOptions = Omit<HttpHexaClientRequestOptions, 'body'>;

export class HttpHexaClientError<TBody = unknown> extends Error {

    constructor(public readonly status: number, public readonly statusText: string, public readonly url: string, public readonly headers: Record<string, string>, public readonly body?: TBody) {
        super(`HTTP request failed with status ${status} ${statusText}`.trim());
        this.name = 'HttpHexaClientError';
    }

}

@Injectable()
export class HttpHexaClient {

    request<TResponse>(method: HttpHexaClientMethod, url: string, options: HttpHexaClientRequestOptions = {}): Observable<TResponse> {
        return defer(() => from(this.performRequest<TResponse>(method, url, options)));
    }

    get<TResponse>(url: string, options: HttpHexaClientQueryRequestOptions = {}): Observable<TResponse> {
        return this.request<TResponse>('GET', url, options);
    }

    post<TResponse, TBody = unknown>(url: string, body?: TBody, options: HttpHexaClientRequestOptions<TBody> = {}): Observable<TResponse> {
        return this.request<TResponse>('POST', url, { ...options, body });
    }

    put<TResponse, TBody = unknown>(url: string, body?: TBody, options: HttpHexaClientRequestOptions<TBody> = {}): Observable<TResponse> {
        return this.request<TResponse>('PUT', url, { ...options, body });
    }

    patch<TResponse, TBody = unknown>(url: string, body?: TBody, options: HttpHexaClientRequestOptions<TBody> = {}): Observable<TResponse> {
        return this.request<TResponse>('PATCH', url, { ...options, body });
    }

    delete<TResponse, TBody = unknown>(url: string, options: HttpHexaClientRequestOptions<TBody> = {}): Observable<TResponse> {
        return this.request<TResponse>('DELETE', url, options);
    }

    head<TResponse>(url: string, options: HttpHexaClientQueryRequestOptions = {}): Observable<TResponse> {
        return this.request<TResponse>('HEAD', url, options);
    }

    options<TResponse>(url: string, options: HttpHexaClientQueryRequestOptions = {}): Observable<TResponse> {
        return this.request<TResponse>('OPTIONS', url, options);
    }

    private async performRequest<TResponse>(method: HttpHexaClientMethod, url: string, options: HttpHexaClientRequestOptions): Promise<TResponse> {
        const requestUrl = this.buildUrl(url, options.params);
        const requestInit = this.buildRequestInit(method, options);
        const response = await this.getFetch()(requestUrl, requestInit);
        const responseType = options.responseType ?? 'json';

        if (!response.ok) {
            const errorBody = await this.readErrorBody(response, responseType);
            throw new HttpHexaClientError(response.status, response.statusText, response.url ?? requestUrl, this.normalizeResponseHeaders(response.headers), errorBody);
        }

        return this.readResponseBody<TResponse>(response, responseType);
    }

    private getFetch(): (input: string, init?: Record<string, unknown>) => Promise<HttpHexaClientResponseLike> {
        const fetchApi = (globalThis as { fetch?: (input: string, init?: Record<string, unknown>) => Promise<HttpHexaClientResponseLike> }).fetch;

        if (!fetchApi) {
            throw new Error('Fetch API is not available in this environment.');
        }

        return fetchApi;
    }

    private buildUrl(url: string, params?: HttpHexaClientParams): string {
        if (!params || Object.keys(params).length === 0) {
            return url;
        }

        const searchParams: string[] = [];

        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                return;
            }

            if (Array.isArray(value)) {
                value.forEach((entry) => {
                    searchParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(entry))}`);
                });
                return;
            }

            searchParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        });

        if (searchParams.length === 0) {
            return url;
        }

        return `${url}${url.includes('?') ? '&' : '?'}${searchParams.join('&')}`;
    }

    private buildRequestInit(method: HttpHexaClientMethod, options: HttpHexaClientRequestOptions): Record<string, unknown> {
        const headers = this.normalizeRequestHeaders(options.headers);
        const init: Record<string, unknown> = {
            method,
            headers,
        };

        if (options.body !== undefined) {
            init.body = this.serializeBody(options.body, headers);
        }

        if (options.credentials) {
            init.credentials = options.credentials;
        } else if (options.withCredentials) {
            init.credentials = 'include';
        }

        if (options.mode) {
            init.mode = options.mode;
        }

        if (options.cache) {
            init.cache = options.cache;
        }

        if (options.redirect) {
            init.redirect = options.redirect;
        }

        if (options.referrer) {
            init.referrer = options.referrer;
        }

        if (options.integrity) {
            init.integrity = options.integrity;
        }

        if (options.keepalive !== undefined) {
            init.keepalive = options.keepalive;
        }

        if (options.signal !== undefined) {
            init.signal = options.signal;
        }

        return init;
    }

    private normalizeRequestHeaders(headers?: HttpHexaClientHeaders): Record<string, string> {
        if (!headers) {
            return {};
        }

        return Object.entries(headers).reduce<Record<string, string>>((accumulator, [key, value]) => {
            accumulator[key] = Array.isArray(value) ? value.map((entry) => String(entry)).join(', ') : String(value);
            return accumulator;
        }, {});
    }

    private normalizeResponseHeaders(headers?: HttpHexaClientHeadersLike | Record<string, string>): Record<string, string> {
        if (!headers) {
            return {};
        }

        const normalized: Record<string, string> = {};

        if (typeof (headers as HttpHexaClientHeadersLike).forEach === 'function') {
            (headers as HttpHexaClientHeadersLike).forEach?.((value, key) => {
                normalized[key] = value;
            });
            return normalized;
        }

        if (typeof (headers as HttpHexaClientHeadersLike).entries === 'function') {
            for (const [key, value] of (headers as HttpHexaClientHeadersLike).entries!()) {
                normalized[key] = value;
            }
            return normalized;
        }

        Object.entries(headers as Record<string, string>).forEach(([key, value]) => {
            normalized[key] = value;
        });

        return normalized;
    }

    private serializeBody(body: unknown, headers: Record<string, string>): unknown {
        if (body === null) {
            return null;
        }

        if (typeof body === 'string' || this.isBinaryBody(body) || this.isNonJsonBody(body)) {
            return body;
        }

        if (!this.hasHeader(headers, 'content-type')) {
            headers['content-type'] = 'application/json';
        }

        return JSON.stringify(body);
    }

    private isBinaryBody(body: unknown): boolean {
        if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) {
            return true;
        }

        if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body)) {
            return true;
        }

        return false;
    }

    private isNonJsonBody(body: unknown): boolean {
        if (!body || typeof body !== 'object') {
            return false;
        }

        const candidate = body as { append?: unknown; getBoundary?: unknown; stream?: unknown; text?: unknown };
        const runtimeGlobal = globalThis as typeof globalThis & { URLSearchParams?: new (...args: never[]) => object };
        const isUrlSearchParams = typeof runtimeGlobal.URLSearchParams === 'function' && body instanceof runtimeGlobal.URLSearchParams;
        return typeof candidate.append === 'function' || typeof candidate.getBoundary === 'function' || typeof candidate.stream === 'function' || isUrlSearchParams;
    }

    private hasHeader(headers: Record<string, string>, key: string): boolean {
        const normalizedKey = key.toLowerCase();
        return Object.keys(headers).some((headerKey) => headerKey.toLowerCase() === normalizedKey);
    }

    private async readResponseBody<TResponse>(response: HttpHexaClientResponseLike, responseType: HttpHexaClientResponseType): Promise<TResponse> {
        switch (responseType) {
            case 'text':
                return await this.readText(response) as TResponse;
            case 'blob':
                return await this.requireMethod(response, response.blob, 'blob')() as TResponse;
            case 'arrayBuffer':
                return await this.requireMethod(response, response.arrayBuffer, 'arrayBuffer')() as TResponse;
            case 'formData':
                return await this.requireMethod(response, response.formData, 'formData')() as TResponse;
            case 'json':
            default:
                return await this.readJson<TResponse>(response);
        }
    }

    private async readErrorBody(response: HttpHexaClientResponseLike, responseType: HttpHexaClientResponseType): Promise<unknown> {
        try {
            return await this.readResponseBody(response, responseType);
        } catch {
            try {
                return await this.readText(response);
            } catch {
                return undefined;
            }
        }
    }

    private async readJson<TResponse>(response: HttpHexaClientResponseLike): Promise<TResponse> {
        if (typeof response.text === 'function') {
            const text = await response.text();

            if (text.length === 0) {
                return null as TResponse;
            }

            return JSON.parse(text) as TResponse;
        }

        return await this.requireMethod(response, response.json, 'json')() as TResponse;
    }

    private async readText(response: HttpHexaClientResponseLike): Promise<string> {
        return await this.requireMethod(response, response.text, 'text')();
    }

    private requireMethod<TValue>(response: HttpHexaClientResponseLike, method: (() => Promise<TValue>) | undefined, responseType: string): () => Promise<TValue> {
        if (!method) {
            throw new Error(`Fetch response does not support ${responseType}() in this environment.`);
        }

        return method.bind(response);
    }

}
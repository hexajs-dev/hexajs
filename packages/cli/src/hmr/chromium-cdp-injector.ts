import { WebSocket } from 'ws';
import { assertLoopbackHost, assertLocalPort } from '../shared/network-security.js';

interface ChromeTarget {
    id: string;
    type: string;
    url: string;
    webSocketDebuggerUrl?: string;
    title?: string;
}

export interface ChromiumCdpInjectorOptions {
    endpoint?: string;
    extensionId?: string;
}

export class ChromiumCdpInjector {
    private endpoint: string;
    private extensionId?: string;

    constructor(options: ChromiumCdpInjectorOptions = {}) {
        const rawEndpoint = options.endpoint ?? process.env.HEXA_CHROMIUM_DEBUG_ENDPOINT ?? 'http://127.0.0.1:9222';
        this.endpoint = this.validateEndpoint(rawEndpoint.replace(/\/+$/, ''));
        this.extensionId = options.extensionId ?? process.env.HEXA_CHROMIUM_EXTENSION_ID;
    }

    private validateEndpoint(endpoint: string): string {
        // DT-02: validate CDP endpoint is loopback-only
        let url: URL;
        try {
            // Add protocol if missing for URL parsing
            const withProtocol = endpoint.includes('://') ? endpoint : `http://${endpoint}`;
            url = new URL(withProtocol);
        } catch {
            throw new Error(`Invalid CDP endpoint URL: "${endpoint}". Expected format: http://127.0.0.1:9222`);
        }

        assertLoopbackHost(url.hostname, 'Chromium CDP endpoint');
        assertLocalPort(Number(url.port), 'Chromium CDP endpoint');

        // Reject credentials, non-root paths, queries, fragments
        if (url.username || url.password) {
            throw new Error(`Chromium CDP endpoint must not include credentials. Received "${endpoint}".`);
        }
        if (url.pathname && url.pathname !== '/') {
            throw new Error(`Chromium CDP endpoint must not include a path. Received "${endpoint}".`);
        }
        if (url.search) {
            throw new Error(`Chromium CDP endpoint must not include query string. Received "${endpoint}".`);
        }
        if (url.hash) {
            throw new Error(`Chromium CDP endpoint must not include fragment. Received "${endpoint}".`);
        }

        return `${url.protocol}//${url.host}`;
    }

    public async injectScript(scriptSource: string): Promise<void> {
        const target = await this.resolveTarget();
        if (!target?.webSocketDebuggerUrl) {
            throw new Error('Unable to locate Chromium extension service worker debug target');
        }

        await this.evaluateScript(target.webSocketDebuggerUrl, scriptSource);
    }

    private async resolveTarget(): Promise<ChromeTarget | undefined> {
        const endpointUrl = `${this.endpoint}/json/list`;
        let response: Response;
        try {
            response = await fetch(endpointUrl);
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            throw new Error(
                `Chromium CDP endpoint is unreachable at ${endpointUrl}. ` +
                `Start Chromium with --remote-debugging-port=9222 or set HEXA_CHROMIUM_DEBUG_ENDPOINT. ` +
                `Original error: ${details}`
            );
        }

        if (!response.ok) {
            throw new Error(
                `Failed to query Chromium debugger endpoint at ${endpointUrl} (status ${response.status}). ` +
                `Confirm Chromium is running with remote debugging enabled.`
            );
        }

        const targets = (await response.json()) as ChromeTarget[];
        const serviceWorkers = targets.filter(t => t.type === 'service_worker' && typeof t.webSocketDebuggerUrl === 'string');

        if (this.extensionId) {
            return serviceWorkers.find(t => t.url.startsWith(`chrome-extension://${this.extensionId}/`));
        }

        return serviceWorkers.find(t => t.url.startsWith('chrome-extension://') && t.url.endsWith('/background/background.bootstrap.js'))
            ?? serviceWorkers.find(t => t.url.startsWith('chrome-extension://') && t.url.endsWith('/background.bootstrap.js'))
            ?? serviceWorkers.find(t => t.url.startsWith('chrome-extension://'));
    }

    private async evaluateScript(debuggerUrl: string, scriptSource: string): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const socket = new WebSocket(debuggerUrl);

            socket.on('open', () => {
                console.log('CDP connection established, injecting background patch...');
                const message = {
                    id: 1,
                    method: 'Runtime.evaluate',
                    params: {
                        expression: scriptSource,
                        awaitPromise: true,
                        returnByValue: true,
                    },
                };
                socket.send(JSON.stringify(message));
            });

            socket.on('message', (buffer) => {
                let parsed: any;
                try {
                    parsed = JSON.parse(buffer.toString());
                } catch {
                    return;
                }

                if (parsed.id !== 1) {
                    return;
                }

                if (parsed.error) {
                    socket.close();
                    reject(new Error(`CDP error: ${JSON.stringify(parsed.error)}`));
                    return;
                }

                if (parsed.result?.exceptionDetails) {
                    socket.close();
                    const details = parsed.result.exceptionDetails;
                    const message = details?.exception?.description
                        ?? details?.text
                        ?? 'CDP evaluate exception while injecting background patch';
                    reject(new Error(message));
                    return;
                }

                socket.close();
                resolve();
            });

            socket.on('error', (error) => {
                reject(error);
            });
        });
    }
}

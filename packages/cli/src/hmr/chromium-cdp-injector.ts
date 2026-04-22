import { WebSocket } from 'ws';

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
        this.endpoint = (options.endpoint ?? process.env.HEXA_CHROMIUM_DEBUG_ENDPOINT ?? 'http://127.0.0.1:9222').replace(/\/+$/, '');
        this.extensionId = options.extensionId ?? process.env.HEXA_CHROMIUM_EXTENSION_ID;
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

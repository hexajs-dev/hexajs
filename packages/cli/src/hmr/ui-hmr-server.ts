import { randomBytes } from 'crypto';
import type { AddressInfo } from 'net';
import { WebSocketServer, WebSocket } from 'ws';
import { HMRClientEvent, HMRServerEvent, ManagedUISurface, ContentPatchInfo, BackgroundReloadEvent } from './events';
import { printInfoLine } from '../shared/logging';
import { assertLocalPort, assertLoopbackHost, formatHostForUrl, isLoopbackSocketAddress } from '../shared/network-security';

export interface UIHMRServerOptions {
    host?: string;
    port?: number;
}

export interface UIHMRServerAddress {
    host: string;
    port: number;
    url: string;
    sessionToken: string;
}

export const DEFAULT_HMR_HOST = '127.0.0.1';
export const DEFAULT_HMR_PORT = 55333;
const HMR_AUTH_TIMEOUT_MS = 1000;

export function resolveHMRServerAddress(options: UIHMRServerOptions = {}): UIHMRServerAddress {
    const host = assertLoopbackHost(options.host ?? DEFAULT_HMR_HOST, 'HMR server host');
    const port = assertLocalPort(options.port ?? DEFAULT_HMR_PORT, 'HMR server port');

    return {
        host,
        port,
        url: `ws://${formatHostForUrl(host)}:${port}`,
        sessionToken: '',
    };
}

export class UIHMRServer {
    private server?: WebSocketServer;
    private pendingContentPatches: ContentPatchInfo[] | null = null;
    private readonly sessionToken = randomBytes(24).toString('hex');
    private readonly authenticatedClients = new WeakSet<WebSocket>();

    constructor(private options: UIHMRServerOptions = {}) {}

    private createServer(host: string, port: number): Promise<WebSocketServer> {
        return new Promise<WebSocketServer>((resolve, reject) => {
            const instance = new WebSocketServer({ host, port });

            instance.once('listening', () => resolve(instance));
            instance.once('error', (error: any) => {
                try {
                    instance.close();
                } catch {
                    // no-op
                }
                reject(error);
            });
        });
    }

    public async start(): Promise<UIHMRServerAddress> {
        const address = resolveHMRServerAddress(this.options);

        if (this.server) {
            const existingAddress = this.server.address() as AddressInfo | string | null;
            const existingPort = typeof existingAddress === 'object' && existingAddress ? existingAddress.port : address.port;
            return {
                host: address.host,
                port: existingPort,
                url: `ws://${formatHostForUrl(address.host)}:${existingPort}`,
                sessionToken: this.sessionToken,
            };
        }

        let server: WebSocketServer;
        try {
            server = await this.createServer(address.host, address.port);
        } catch (error: any) {
            if (error?.code !== 'EADDRINUSE') {
                throw error;
            }
            server = await this.createServer(address.host, 0);
        }

        this.server = server;

        this.server.on('connection', (ws: WebSocket, request) => {
            if (!isLoopbackSocketAddress(request.socket.remoteAddress)) {
                ws.terminate();
                return;
            }

            const authTimeout = setTimeout(() => {
                if (!this.authenticatedClients.has(ws)) {
                    ws.close(1008, 'HMR auth required');
                }
            }, HMR_AUTH_TIMEOUT_MS);

            ws.once('close', () => {
                clearTimeout(authTimeout);
            });

            ws.on('message', (data: Buffer | string) => {
                try {
                    const msg = JSON.parse(typeof data === 'string' ? data : data.toString('utf-8')) as HMRClientEvent;

                    if (msg?.type === 'auth') {
                        if (msg.token !== this.sessionToken) {
                            ws.close(1008, 'Invalid HMR token');
                            return;
                        }

                        this.authenticatedClients.add(ws);
                        clearTimeout(authTimeout);
                        return;
                    }

                    if (!this.authenticatedClients.has(ws)) {
                        return;
                    }

                    if (msg?.type === 'background:online' && this.pendingContentPatches) {
                        const patches = this.pendingContentPatches;
                        this.pendingContentPatches = null;
                        printInfoLine('Background came online — re-injecting content scripts');
                        this.publishContentReload(patches);
                    }
                } catch {
                    // ignore malformed client messages
                }
            });
        });

        const actualAddress = this.server.address() as AddressInfo | string | null;
        const actualPort = typeof actualAddress === 'object' && actualAddress ? actualAddress.port : address.port;

        return {
            host: address.host,
            port: actualPort,
            url: `ws://${formatHostForUrl(address.host)}:${actualPort}`,
            sessionToken: this.sessionToken,
        };
    }

    public publishUpdate(surface: ManagedUISurface, changedPath: string): void {
        this.broadcast({
            type: 'ui:update',
            surface,
            changedPath,
            timestamp: Date.now(),
        });
    }

    public publishReload(surface: ManagedUISurface, reason: string): void {
        this.broadcast({
            type: 'ui:reload',
            surface,
            reason,
            timestamp: Date.now(),
        });
    }

    public publishBuildError(message: string): void {
        this.broadcast({
            type: 'build:error',
            message,
            timestamp: Date.now(),
        });
    }

    public publishContentReload(patches: ContentPatchInfo[]): void {
        this.broadcast({
            type: 'content:reload',
            patches,
            timestamp: Date.now(),
        });
    }

    public setPendingContentPatches(patches: ContentPatchInfo[]): void {
        this.pendingContentPatches = patches;
    }

    public publishBackgroundReload(event: Omit<BackgroundReloadEvent, 'type' | 'timestamp'>): void {
        this.broadcast({
            type: 'background:reload',
            timestamp: Date.now(),
            ...event,
        });
    }

    public publish(event: HMRServerEvent): void {
        this.broadcast(event);
    }

    public async close(): Promise<void> {
        if (!this.server) {
            return;
        }

        const instance = this.server;
        this.server = undefined;

        instance.clients.forEach((client: WebSocket) => client.terminate());

        await new Promise<void>((resolve, reject) => {
            instance.close((error?: Error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    private broadcast(event: HMRServerEvent): void {
        if (!this.server) {
            return;
        }

        const payload = JSON.stringify(event);
        this.server.clients.forEach((client: WebSocket) => {
            if (client.readyState === client.OPEN && this.authenticatedClients.has(client)) {
                client.send(payload);
            }
        });
    }
}

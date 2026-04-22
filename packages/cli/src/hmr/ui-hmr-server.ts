import type { AddressInfo } from 'net';
import { WebSocketServer, WebSocket } from 'ws';
import { HMRServerEvent, ManagedUISurface, ContentPatchInfo, BackgroundReloadEvent } from './events';
import { printInfoLine } from '../shared/logging';

export interface UIHMRServerOptions {
    host?: string;
    port?: number;
}

export interface UIHMRServerAddress {
    host: string;
    port: number;
    url: string;
}

export const DEFAULT_HMR_HOST = '127.0.0.1';
export const DEFAULT_HMR_PORT = 55333;

export function resolveHMRServerAddress(options: UIHMRServerOptions = {}): UIHMRServerAddress {
    const host = options.host ?? DEFAULT_HMR_HOST;
    const port = options.port ?? DEFAULT_HMR_PORT;

    return {
        host,
        port,
        url: `ws://${host}:${port}`,
    };
}

export class UIHMRServer {
    private server?: WebSocketServer;
    private pendingContentPatches: ContentPatchInfo[] | null = null;

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
                url: `ws://${address.host}:${existingPort}`,
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

        this.server.on('connection', (ws: WebSocket) => {
            ws.on('message', (data: Buffer | string) => {
                try {
                    const msg = JSON.parse(typeof data === 'string' ? data : data.toString('utf-8'));
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
            url: `ws://${address.host}:${actualPort}`,
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
            if (client.readyState === client.OPEN) {
                client.send(payload);
            }
        });
    }
}

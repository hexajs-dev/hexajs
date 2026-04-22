import * as fs from 'fs';
import * as path from 'path';
import type { Socket } from 'net';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { printWarningLine } from '../shared/logging';

export interface BackgroundPatchServerOptions {
    host?: string;
    port?: number;
    rootDir: string;
}

export interface BackgroundPatchServerAddress {
    host: string;
    port: number;
    url: string;
}

export const DEFAULT_PATCH_SERVER_HOST = 'localhost';
export const DEFAULT_PATCH_SERVER_PORT = 5173;

function normalizePathname(pathname: string): string {
    if (!pathname || pathname === '/') {
        return '/';
    }
    return pathname.replace(/\\/g, '/');
}

function resolveMimeType(filePath: string): string {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        return 'application/javascript; charset=utf-8';
    }
    if (filePath.endsWith('.json')) {
        return 'application/json; charset=utf-8';
    }
    if (filePath.endsWith('.css')) {
        return 'text/css; charset=utf-8';
    }
    if (filePath.endsWith('.html')) {
        return 'text/html; charset=utf-8';
    }
    if (filePath.endsWith('.svg')) {
        return 'image/svg+xml';
    }
    return 'application/octet-stream';
}

export class BackgroundPatchServer {
    private server?: Server;
    private address?: BackgroundPatchServerAddress;
    private sockets = new Set<Socket>();

    constructor(private options: BackgroundPatchServerOptions) {}

    private listenWithFallback(server: Server, host: string, requestedPort: number): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const tryListen = (port: number) => {
                const onError = (error: NodeJS.ErrnoException) => {
                    if (error.code !== 'EADDRINUSE') {
                        reject(error);
                        return;
                    }
                    server.removeListener('error', onError);
                    printWarningLine(`Patch server port ${requestedPort} is already in use, switching to a random available port`);
                    tryListen(0);
                };

                server.once('error', onError);
                server.listen(port, host, () => {
                    server.removeListener('error', onError);
                    resolve((server.address() as import('net').AddressInfo).port);
                });
            };

            tryListen(requestedPort);
        });
    }

    public async start(): Promise<BackgroundPatchServerAddress> {
        if (this.address) {
            return this.address;
        }

        const host = this.options.host ?? DEFAULT_PATCH_SERVER_HOST;
        const requestedPort = this.options.port ?? DEFAULT_PATCH_SERVER_PORT;

        this.server = createServer((request, response) => {
            this.handleRequest(request, response);
        });

        this.server.on('connection', (socket: Socket) => {
            this.sockets.add(socket);
            socket.once('close', () => this.sockets.delete(socket));
        });

        const actualPort = await this.listenWithFallback(this.server, host, requestedPort);

        this.address = {
            host,
            port: actualPort,
            url: `http://${host}:${actualPort}`,
        };

        return this.address;
    }

    public buildPatchUrl(relativeFile: string): string {
        if (!this.address) {
            throw new Error('Patch server is not running');
        }

        const normalized = relativeFile.replace(/\\/g, '/').replace(/^\/+/, '');
        return `${this.address.url}/${normalized}`;
    }

    public async close(): Promise<void> {
        if (!this.server) {
            return;
        }

        const activeServer = this.server;
        this.server = undefined;
        this.address = undefined;

        this.sockets.forEach((socket) => socket.destroy());
        this.sockets.clear();

        await new Promise<void>((resolve, reject) => {
            activeServer.close((error?: Error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    private handleRequest(request: IncomingMessage, response: ServerResponse): void {
        const requestUrl = new URL(request.url || '/', 'http://localhost');
        const pathname = normalizePathname(requestUrl.pathname);
        const safeRelative = pathname.replace(/^\/+/, '');
        const absolute = path.resolve(this.options.rootDir, safeRelative);
        const root = path.resolve(this.options.rootDir);

        if (!absolute.startsWith(root)) {
            response.statusCode = 403;
            response.end('Forbidden');
            return;
        }

        if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) {
            response.statusCode = 404;
            response.end('Not found');
            return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', resolveMimeType(absolute));
        response.setHeader('Cache-Control', 'no-store, max-age=0');
        fs.createReadStream(absolute).pipe(response);
    }
}

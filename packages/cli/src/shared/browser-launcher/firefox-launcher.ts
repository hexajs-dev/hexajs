import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import { DEFAULT_FIREFOX_RDP_PORT, FIREFOX_DEBUGGING_PAGE } from './shared';

export interface InstallFirefoxAddonOptions {
    extensionDir: string;
    port?: number;
    host?: string;
    /** Total time to wait for the Firefox debugger to come up before failing. */
    connectTimeoutMs?: number;
    /** Delay between TCP connect retries while the debugger is starting. */
    connectIntervalMs?: number;
    /** Time to wait for individual RDP responses after a connection is established. */
    requestTimeoutMs?: number;
    env?: NodeJS.ProcessEnv;
}

export interface InstallFirefoxAddonResult {
    addonId: string;
    addonActor?: string;
    temporarilyInstalled: boolean;
    port: number;
}

interface RdpMessage {
    [key: string]: unknown;
    from?: string;
    error?: string;
    message?: string;
}

interface RdpClient {
    socket: net.Socket;
    next(): Promise<RdpMessage>;
    send(message: RdpMessage): void;
    close(): void;
}

export function resolveFirefoxDebugPort(explicitPort: number | undefined, env: NodeJS.ProcessEnv = process.env): number {
    if (Number.isFinite(explicitPort) && explicitPort && explicitPort > 0) {
        return Number(explicitPort);
    }

    const fromEnv = env.HEXA_FIREFOX_RDP_PORT;
    if (fromEnv) {
        const parsed = Number(fromEnv);
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return DEFAULT_FIREFOX_RDP_PORT;
}

export function getPlatformFirefoxCandidates(env: NodeJS.ProcessEnv): string[] {
    if (process.platform === 'win32') {
        const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LocalAppData].filter(Boolean) as string[];
        return [
            ...roots.map(root => path.join(root, 'Mozilla Firefox', 'firefox.exe')),
            ...roots.map(root => path.join(root, 'Firefox Developer Edition', 'firefox.exe')),
        ];
    }

    if (process.platform === 'darwin') {
        const homeDir = env.HOME || os.homedir();
        return [
            '/Applications/Firefox.app/Contents/MacOS/firefox',
            path.join(homeDir, 'Applications', 'Firefox.app', 'Contents', 'MacOS', 'firefox'),
        ];
    }

    return [
        '/usr/bin/firefox',
        '/snap/bin/firefox',
    ];
}

export function seedFirefoxDevProfile(userDataDir: string, debugPort: number): void {
    const userPrefsPath = path.join(userDataDir, 'user.js');
    const prefs: Record<string, string | number | boolean> = {
        // Enable the Remote Debugging Protocol on the chosen port without prompting.
        'devtools.debugger.remote-enabled': true,
        'devtools.debugger.prompt-connection': false,
        'devtools.debugger.force-local': true,
        'devtools.debugger.remote-port': debugPort,
        'devtools.chrome.enabled': true,
        // Allow installing unsigned/temporary add-ons during development.
        // (Honored on Developer Edition / Nightly / Unbranded; harmless on release.)
        'xpinstall.signatures.required': false,
        'extensions.experiments.enabled': true,
        // Quiet first-run UI so the dev profile is reusable.
        'browser.shell.checkDefaultBrowser': false,
        'browser.startup.homepage_override.mstone': 'ignore',
        'startup.homepage_welcome_url': '',
        'startup.homepage_welcome_url.additional': '',
        'datareporting.policy.firstRunURL': '',
        'app.normandy.first_run': false,
        // Prevent automatic updates from interrupting development.
        'app.update.enabled': false,
        'app.update.auto': false,
        'app.update.silent': false,
    };

    const lines = Object.entries(prefs).map(([key, value]) => `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`);
    fs.writeFileSync(userPrefsPath, `${lines.join('\n')}\n`, 'utf-8');
}

export function buildFirefoxLaunchArgs(userDataDir: string, debugPort: number): string[] {
    const normalizedUserDataDir = path.resolve(userDataDir);
    return [
        '-no-remote',
        '-profile',
        normalizedUserDataDir,
        '-start-debugger-server',
        String(debugPort),
        FIREFOX_DEBUGGING_PAGE,
    ];
}

export function clearFirefoxStaleLockFiles(userDataDir: string): void {
    const lockFiles = ['parent.lock', '.parentlock'];
    for (const lockFile of lockFiles) {
        const lockPath = path.join(userDataDir, lockFile);
        try {
            if (fs.existsSync(lockPath)) {
                fs.unlinkSync(lockPath);
            }
        } catch {
            // Best-effort: if we can't remove the lock, Firefox will handle it.
        }
    }
}

function createRdpClient(socket: net.Socket, requestTimeoutMs: number): RdpClient {
    const pending: RdpMessage[] = [];
    const waiters: Array<{ resolve: (msg: RdpMessage) => void; reject: (err: Error) => void; timer: NodeJS.Timeout }> = [];
    let buffer = Buffer.alloc(0);
    let closed = false;
    let pendingError: Error | null = null;

    function rejectAllWaiters(error: Error): void {
        while (waiters.length > 0) {
            const waiter = waiters.shift()!;
            clearTimeout(waiter.timer);
            waiter.reject(error);
        }
    }

    socket.on('data', (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length > 0) {
            const colonIndex = buffer.indexOf(0x3a); // ':'
            if (colonIndex === -1) {
                return;
            }
            const lengthStr = buffer.subarray(0, colonIndex).toString('ascii');
            const length = Number.parseInt(lengthStr, 10);
            if (!Number.isFinite(length) || length < 0) {
                pendingError = new Error(`Invalid Firefox RDP frame length: ${lengthStr}`);
                rejectAllWaiters(pendingError);
                socket.destroy();
                return;
            }
            if (buffer.length < colonIndex + 1 + length) {
                return;
            }
            const body = buffer.subarray(colonIndex + 1, colonIndex + 1 + length).toString('utf-8');
            buffer = buffer.subarray(colonIndex + 1 + length);
            let parsed: RdpMessage;
            try {
                parsed = JSON.parse(body) as RdpMessage;
            } catch (error) {
                pendingError = new Error(`Failed to parse Firefox RDP message: ${body}`);
                rejectAllWaiters(pendingError);
                socket.destroy();
                return;
            }
            if (waiters.length > 0) {
                const waiter = waiters.shift()!;
                clearTimeout(waiter.timer);
                waiter.resolve(parsed);
            } else {
                pending.push(parsed);
            }
        }
    });

    socket.on('error', (error: Error) => {
        pendingError = error;
        rejectAllWaiters(error);
    });

    socket.on('close', () => {
        closed = true;
        if (!pendingError) {
            pendingError = new Error('Firefox RDP connection closed unexpectedly.');
        }
        rejectAllWaiters(pendingError);
    });

    return {
        socket,
        next(): Promise<RdpMessage> {
            if (pending.length > 0) {
                return Promise.resolve(pending.shift()!);
            }
            if (closed || pendingError) {
                return Promise.reject(pendingError ?? new Error('Firefox RDP connection is closed.'));
            }
            return new Promise<RdpMessage>((resolve, reject) => {
                const timer = setTimeout(() => {
                    const index = waiters.findIndex(w => w.resolve === resolve);
                    if (index >= 0) {
                        waiters.splice(index, 1);
                    }
                    reject(new Error(`Timed out waiting for Firefox RDP response after ${requestTimeoutMs}ms.`));
                }, requestTimeoutMs);
                if (typeof timer.unref === 'function') {
                    timer.unref();
                }
                waiters.push({ resolve, reject, timer });
            });
        },
        send(message: RdpMessage): void {
            const json = JSON.stringify(message);
            const length = Buffer.byteLength(json, 'utf-8');
            socket.write(`${length}:${json}`);
        },
        close(): void {
            closed = true;
            try {
                socket.end();
            } catch {
                // ignore
            }
            try {
                socket.destroy();
            } catch {
                // ignore
            }
        },
    };
}

function connectRdpSocket(host: string, port: number): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection({ host, port });
        const onError = (error: Error) => {
            socket.removeListener('connect', onConnect);
            reject(error);
        };
        const onConnect = () => {
            socket.removeListener('error', onError);
            resolve(socket);
        };
        socket.once('error', onError);
        socket.once('connect', onConnect);
    });
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
        const timer = setTimeout(resolve, ms);
        if (typeof timer.unref === 'function') {
            timer.unref();
        }
    });
}

export async function installFirefoxAddonOverRDP(options: InstallFirefoxAddonOptions): Promise<InstallFirefoxAddonResult> {
    const env = options.env ?? process.env;
    const port = resolveFirefoxDebugPort(options.port, env);
    const host = options.host ?? '127.0.0.1';
    const connectTimeoutMs = options.connectTimeoutMs ?? 30_000;
    const connectIntervalMs = options.connectIntervalMs ?? 500;
    const requestTimeoutMs = options.requestTimeoutMs ?? 15_000;
    const extensionDir = path.resolve(options.extensionDir);

    if (!fs.existsSync(extensionDir)) {
        throw new Error(`Extension output directory does not exist: ${extensionDir}`);
    }

    const startTime = Date.now();
    let socket: net.Socket | null = null;
    let lastError: Error | null = null;

    while (Date.now() - startTime <= connectTimeoutMs) {
        try {
            socket = await connectRdpSocket(host, port);
            break;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const code = (lastError as NodeJS.ErrnoException).code;
            // Retry only while Firefox is still starting up.
            if (code !== 'ECONNREFUSED' && code !== 'ECONNRESET' && code !== 'ETIMEDOUT') {
                throw lastError;
            }
            await delay(connectIntervalMs);
        }
    }

    if (!socket) {
        const reason = lastError ? `: ${lastError.message}` : '';
        throw new Error(`Could not connect to Firefox debugger at ${host}:${port} within ${connectTimeoutMs}ms${reason}.`);
    }

    const client = createRdpClient(socket, requestTimeoutMs);
    try {
        // The server emits a greeting packet on connect. Discard it.
        await client.next();

        client.send({ to: 'root', type: 'getRoot' });
        const root = await client.next();
        const addonsActor = typeof root.addonsActor === 'string' ? root.addonsActor : null;
        if (!addonsActor) {
            throw new Error('Firefox debugger did not expose an addons actor. Update Firefox or check the dev profile prefs.');
        }

        client.send({ to: addonsActor, type: 'installTemporaryAddon', addonPath: extensionDir });
        const installResponse = await client.next();
        if (installResponse.error) {
            const detail = typeof installResponse.message === 'string' ? installResponse.message : String(installResponse.error);
            throw new Error(`Firefox refused the temporary add-on install (${installResponse.error}): ${detail}`);
        }

        const addon = installResponse.addon as { id?: string; actor?: string; temporarilyInstalled?: boolean } | undefined;
        if (!addon?.id) {
            throw new Error('Firefox accepted the install request but returned no addon id.');
        }

        return {
            addonId: addon.id,
            addonActor: addon.actor,
            temporarilyInstalled: addon.temporarilyInstalled !== false,
            port,
        };
    } finally {
        client.close();
    }
}

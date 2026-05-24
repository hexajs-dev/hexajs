import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

export type AutoLaunchBrowserPlatform = 'chrome' | 'edge' | 'firefox' | 'opera' | 'brave';

export const AUTO_LAUNCH_PLATFORMS: AutoLaunchBrowserPlatform[] = ['chrome', 'edge', 'firefox', 'opera', 'brave'];

export interface ResolveChromeExecutableOptions {
    executablePath?: string;
    env?: NodeJS.ProcessEnv;
}

export interface ResolveBrowserExecutableOptions {
    platform: AutoLaunchBrowserPlatform;
    executablePath?: string;
    env?: NodeJS.ProcessEnv;
}

export type ChromiumExecutableKind = 'chromium-like' | 'google-chrome';

export interface ChromiumPreferencesShape {
    extensions?: {
        pinned_extensions?: string[];
        ui?: {
            developer_mode?: boolean;
        };
        settings?: {
            [extensionId: string]: {
                state?: number;
                location?: number;
                path?: string;
                manifest?: object;
            };
        };
    };
    toolbar?: {
        pinned_actions?: string[];
    };
}

export const DEFAULT_CHROME_DEBUG_PORT = 9222;
export const DEFAULT_FIREFOX_RDP_PORT = 6000;
export const CHROME_EXTENSIONS_PAGE = 'chrome://extensions/';
export const EDGE_EXTENSIONS_PAGE = 'edge://extensions/';
export const BRAVE_EXTENSIONS_PAGE = 'brave://extensions/';
export const OPERA_EXTENSIONS_PAGE = 'opera://extensions/';
export const FIREFOX_DEBUGGING_PAGE = 'about:debugging#/runtime/this-firefox';

export function isAutoLaunchSupportedPlatform(platform: string): platform is AutoLaunchBrowserPlatform {
    return (AUTO_LAUNCH_PLATFORMS as string[]).includes(platform);
}

export function getWindowsCmdPath(env: NodeJS.ProcessEnv): string {
    const systemRoot = env.SystemRoot || env.WINDIR;
    if (!systemRoot) {
        throw new Error('Unable to resolve Windows cmd.exe path because SystemRoot/WINDIR is not available.');
    }

    const cmdPath = path.join(systemRoot, 'System32', 'cmd.exe');
    if (!fs.existsSync(cmdPath)) {
        throw new Error(`Unable to locate cmd.exe at expected path: ${cmdPath}`);
    }

    return cmdPath;
}

export function resolveExecutableFromPath(names: string[], env: NodeJS.ProcessEnv): string | null {
    for (const name of names) {
        try {
            const output = process.platform === 'win32'
                ? execFileSync(getWindowsCmdPath(env), ['/d', '/s', '/c', `where ${name}`], { encoding: 'utf-8', stdio: 'pipe', windowsHide: true })
                : execFileSync('which', [name], { encoding: 'utf-8', stdio: 'pipe' });
            const firstLine = output.split(/\r?\n/).map(line => line.trim()).find(Boolean);
            if (firstLine && fs.existsSync(firstLine)) {
                return firstLine;
            }
        } catch {
            // Try the next executable name.
        }
    }

    return null;
}

export function listExistingDirectories(paths: string[]): string[] {
    return paths.filter(candidate => !!candidate && fs.existsSync(candidate) && fs.statSync(candidate).isDirectory());
}

export function findNewestMatchingExecutable(searchRoots: string[], matcher: (filePath: string) => boolean, maxDepth: number): string | null {
    const queue = listExistingDirectories(searchRoots).map(root => ({ dir: root, depth: 0 }));
    let newestMatch: { filePath: string; mtimeMs: number } | null = null;

    while (queue.length > 0) {
        const current = queue.shift()!;
        let entries: fs.Dirent[] = [];
        try {
            entries = fs.readdirSync(current.dir, { withFileTypes: true });
        } catch {
            continue;
        }

        for (const entry of entries) {
            const fullPath = path.join(current.dir, entry.name);
            if (entry.isDirectory()) {
                if (current.depth < maxDepth) {
                    queue.push({ dir: fullPath, depth: current.depth + 1 });
                }
                continue;
            }

            if (!entry.isFile() || !matcher(fullPath)) {
                continue;
            }

            try {
                const stats = fs.statSync(fullPath);
                if (!newestMatch || stats.mtimeMs > newestMatch.mtimeMs) {
                    newestMatch = { filePath: fullPath, mtimeMs: stats.mtimeMs };
                }
            } catch {
                // Ignore unreadable matches.
            }
        }
    }

    return newestMatch?.filePath ?? null;
}

export function getBrowserOverrideEnvKey(platform: AutoLaunchBrowserPlatform): string {
    if (platform === 'chrome') {
        return 'HEXA_CHROME_PATH';
    }

    if (platform === 'edge') {
        return 'HEXA_EDGE_PATH';
    }

    if (platform === 'firefox') {
        return 'HEXA_FIREFOX_PATH';
    }

    if (platform === 'opera') {
        return 'HEXA_OPERA_PATH';
    }

    return 'HEXA_BRAVE_PATH';
}

export function getPathCommandCandidates(platform: AutoLaunchBrowserPlatform): string[] {
    if (platform === 'chrome') {
        return process.platform === 'win32' ? ['chrome'] : ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'];
    }

    if (platform === 'edge') {
        return process.platform === 'win32' ? ['msedge', 'microsoft-edge'] : ['microsoft-edge', 'microsoft-edge-stable'];
    }

    if (platform === 'firefox') {
        return ['firefox'];
    }

    if (platform === 'opera') {
        return ['opera'];
    }

    return process.platform === 'win32' ? ['brave'] : ['brave-browser', 'brave'];
}

export function getBrowserDisplayName(platform: AutoLaunchBrowserPlatform): string {
    if (platform === 'chrome') {
        return 'Chrome';
    }

    if (platform === 'edge') {
        return 'Edge';
    }

    if (platform === 'firefox') {
        return 'Firefox';
    }

    if (platform === 'opera') {
        return 'Opera';
    }

    return 'Brave';
}

export function resolveBrowserOverridePath(options: ResolveBrowserExecutableOptions): string | null {
    const env = options.env ?? process.env;
    const overrideKey = getBrowserOverrideEnvKey(options.platform);
    const requested = options.executablePath?.trim() || env[overrideKey]?.trim();
    if (!requested) {
        return null;
    }

    const resolved = path.resolve(requested);
    if (!fs.existsSync(resolved)) {
        const browserName = getBrowserDisplayName(options.platform);
        throw new Error(`${browserName} executable not found: ${resolved}. Set ${overrideKey} to a valid executable path.`);
    }

    return resolved;
}

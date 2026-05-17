import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync, spawn } from 'child_process';

export interface ResolveChromeExecutableOptions {
    executablePath?: string;
    env?: NodeJS.ProcessEnv;
}

export type ChromiumExecutableKind = 'chromium-like' | 'google-chrome';

export interface LaunchChromeWithExtensionOptions {
    extensionDir: string;
    executablePath?: string;
    userDataDir?: string;
    debugPort?: number;
    env?: NodeJS.ProcessEnv;
}

export interface LaunchChromeWithExtensionResult {
    executablePath: string;
    executableKind: ChromiumExecutableKind;
    extensionDir: string;
    extensionId: string;
    userDataDir: string;
    debugPort: number;
    args: string[];
}

const DEFAULT_CHROME_DEBUG_PORT = 9222;
const CHROME_EXTENSIONS_PAGE = 'chrome://extensions/';

interface ChromiumPreferencesShape {
    extensions?: {
        pinned_extensions?: string[];
    };
    toolbar?: {
        pinned_actions?: string[];
    };
}

function getWindowsCmdPath(env: NodeJS.ProcessEnv): string {
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

function resolveExecutableFromPath(names: string[], env: NodeJS.ProcessEnv): string | null {
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

function listExistingDirectories(paths: string[]): string[] {
    return paths.filter(candidate => !!candidate && fs.existsSync(candidate) && fs.statSync(candidate).isDirectory());
}

function findNewestMatchingExecutable(searchRoots: string[], matcher: (filePath: string) => boolean, maxDepth: number): string | null {
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

function getNonBrandedChromiumCandidates(env: NodeJS.ProcessEnv): string[] {
    const homeDir = env.USERPROFILE || env.HOME || os.homedir();

    if (process.platform === 'win32') {
        const directCandidates = [
            path.join(env.LocalAppData || '', 'Chromium', 'Application', 'chrome.exe'),
            path.join(env.LocalAppData || '', 'Google', 'Chrome for Testing', 'Application', 'chrome.exe'),
            path.join(env.ProgramFiles || '', 'Chromium', 'Application', 'chrome.exe'),
            path.join(env.ProgramFiles || '', 'Google', 'Chrome for Testing', 'Application', 'chrome.exe'),
        ].filter(Boolean);

        const scannedCandidate = findNewestMatchingExecutable(
            [
                path.join(homeDir, '.codeium', 'ws-browser'),
                path.join(homeDir, '.cache', 'puppeteer'),
                path.join(homeDir, 'AppData', 'Local', 'ms-playwright'),
            ],
            filePath => {
                const normalized = filePath.replace(/\\/g, '/').toLowerCase();
                return normalized.endsWith('/chrome.exe')
                    && (normalized.includes('/chromium-')
                        || normalized.includes('/chrome-win')
                        || normalized.includes('/chrome-for-testing')
                        || normalized.includes('/puppeteer'));
            },
            5,
        );

        return [...directCandidates, ...(scannedCandidate ? [scannedCandidate] : [])];
    }

    if (process.platform === 'darwin') {
        const directCandidates = [
            '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            path.join(homeDir, 'Applications', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
            path.join(homeDir, 'Applications', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
        ];

        const scannedCandidate = findNewestMatchingExecutable(
            [
                path.join(homeDir, '.cache', 'puppeteer'),
                path.join(homeDir, 'Library', 'Caches', 'ms-playwright'),
            ],
            filePath => {
                const normalized = filePath.replace(/\\/g, '/').toLowerCase();
                return (normalized.endsWith('/chromium') || normalized.endsWith('/google chrome for testing'))
                    && (normalized.includes('/chromium.app/') || normalized.includes('/chrome for testing.app/'));
            },
            6,
        );

        return [...directCandidates, ...(scannedCandidate ? [scannedCandidate] : [])];
    }

    return [
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/opt/google/chrome-for-testing/chrome',
        '/snap/bin/chromium',
    ];
}

function getPlatformChromeCandidates(env: NodeJS.ProcessEnv): string[] {
    const nonBrandedCandidates = getNonBrandedChromiumCandidates(env);

    if (process.platform === 'win32') {
        const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LocalAppData].filter(Boolean) as string[];
        return [...nonBrandedCandidates, ...roots.map(root => path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'))];
    }

    if (process.platform === 'darwin') {
        const homeDir = env.HOME || os.homedir();
        return [
            ...nonBrandedCandidates,
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            path.join(homeDir, 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
        ];
    }

    return [
        ...nonBrandedCandidates,
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
    ];
}

function resolveChromeOverridePath(options: ResolveChromeExecutableOptions): string | null {
    const env = options.env ?? process.env;
    const requested = options.executablePath?.trim() || env.HEXA_CHROME_PATH?.trim();
    if (!requested) {
        return null;
    }

    const resolved = path.resolve(requested);
    if (!fs.existsSync(resolved)) {
        throw new Error(`Chrome executable not found: ${resolved}. Set HEXA_CHROME_PATH to a valid Chrome binary path.`);
    }

    return resolved;
}

export function classifyChromiumExecutable(executablePath: string): ChromiumExecutableKind {
    const normalized = path.resolve(executablePath).replace(/\\/g, '/').toLowerCase();
    if ((normalized.includes('/google/chrome/application/chrome.exe') || normalized.includes('/google chrome.app/contents/macos/google chrome'))
        && !normalized.includes('chrome for testing')) {
        return 'google-chrome';
    }

    return 'chromium-like';
}

export function resolveChromeExecutablePath(options: ResolveChromeExecutableOptions = {}): string {
    const env = options.env ?? process.env;
    const overridePath = resolveChromeOverridePath(options);
    if (overridePath) {
        return overridePath;
    }

    const candidates = getPlatformChromeCandidates(env);
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    const executable = resolveExecutableFromPath(
        process.platform === 'win32' ? ['chrome'] : ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'],
        env,
    );

    if (executable) {
        return executable;
    }

    throw new Error('Unable to locate Chrome automatically. Install Chrome or set HEXA_CHROME_PATH to the executable path.');
}

export function computeChromiumExtensionId(extensionDir: string): string {
    const resolvedPath = path.resolve(extensionDir);
    const normalizedPath = process.platform === 'win32' && /^[a-z]:/i.test(resolvedPath)
        ? `${resolvedPath.charAt(0).toUpperCase()}${resolvedPath.slice(1)}`
        : resolvedPath;
    const hashInput = process.platform === 'win32'
        ? Buffer.from(normalizedPath, 'utf16le')
        : Buffer.from(normalizedPath, 'utf8');
    const hashHex = crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 32);
    return hashHex.replace(/[0-9a-f]/g, char => String.fromCharCode('a'.charCodeAt(0) + parseInt(char, 16)));
}

function readChromiumPreferences(preferencesPath: string): ChromiumPreferencesShape {
    if (!fs.existsSync(preferencesPath)) {
        return {};
    }

    try {
        const raw = fs.readFileSync(preferencesPath, 'utf-8');
        const parsed = JSON.parse(raw) as ChromiumPreferencesShape;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function seedPinnedExtensionState(userDataDir: string, extensionId: string): void {
    const defaultProfileDir = path.join(userDataDir, 'Default');
    const preferencesPath = path.join(defaultProfileDir, 'Preferences');
    fs.mkdirSync(defaultProfileDir, { recursive: true });

    const preferences = readChromiumPreferences(preferencesPath);
    preferences.extensions = preferences.extensions ?? {};
    preferences.toolbar = preferences.toolbar ?? {};

    const pinnedExtensions = new Set(preferences.extensions.pinned_extensions ?? []);
    pinnedExtensions.add(extensionId);
    preferences.extensions.pinned_extensions = Array.from(pinnedExtensions);

    const pinnedActions = new Set(preferences.toolbar.pinned_actions ?? []);
    pinnedActions.add(extensionId);
    preferences.toolbar.pinned_actions = Array.from(pinnedActions);

    fs.writeFileSync(preferencesPath, JSON.stringify(preferences), 'utf-8');
}

export function resolveChromeDebugPort(explicitPort: number | undefined, env: NodeJS.ProcessEnv = process.env): number {
    if (Number.isFinite(explicitPort) && explicitPort && explicitPort > 0) {
        return Number(explicitPort);
    }

    const endpoint = env.HEXA_CHROMIUM_DEBUG_ENDPOINT;
    if (endpoint) {
        try {
            const parsed = new URL(endpoint);
            const parsedPort = Number(parsed.port);
            if (Number.isFinite(parsedPort) && parsedPort > 0) {
                return parsedPort;
            }
        } catch {
            // Fallback to the default port.
        }
    }

    return DEFAULT_CHROME_DEBUG_PORT;
}

function getDefaultChromeUserDataDir(extensionDir: string, executablePath: string): string {
    const profileKey = JSON.stringify({
        extensionDir: path.resolve(extensionDir),
        executablePath: path.resolve(executablePath),
    });
    const hash = crypto.createHash('sha1').update(profileKey).digest('hex').slice(0, 12);
    return path.join(os.tmpdir(), 'hexajs', 'chrome-dev-profile', hash);
}

export function buildChromeLaunchArgs(extensionDir: string, userDataDir: string, debugPort: number): string[] {
    const normalizedExtensionDir = path.resolve(extensionDir);
    const normalizedUserDataDir = path.resolve(userDataDir);

    return [
        `--disable-extensions-except=${normalizedExtensionDir}`,
        `--load-extension=${normalizedExtensionDir}`,
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${normalizedUserDataDir}`,
        '--enable-unsafe-extension-debugging',
        '--no-first-run',
        '--no-default-browser-check',
        CHROME_EXTENSIONS_PAGE,
    ];
}

export function launchChromeWithExtension(options: LaunchChromeWithExtensionOptions): LaunchChromeWithExtensionResult {
    const env = options.env ?? process.env;
    const extensionDir = path.resolve(options.extensionDir);
    const hasExplicitBrowserOverride = !!(options.executablePath?.trim() || env.HEXA_CHROME_PATH?.trim());

    if (!fs.existsSync(extensionDir)) {
        throw new Error(`Extension output directory does not exist: ${extensionDir}`);
    }

    const executablePath = resolveChromeExecutablePath({ executablePath: options.executablePath, env });
    const executableKind = classifyChromiumExecutable(executablePath);
    if (executableKind === 'google-chrome' && !hasExplicitBrowserOverride) {
        throw new Error('Installed Google Chrome blocks --load-extension for unpacked extensions. Install Chromium or Chrome for Testing, or set HEXA_CHROME_PATH to a compatible browser executable.');
    }
    const debugPort = resolveChromeDebugPort(options.debugPort, env);
    const userDataDir = path.resolve(options.userDataDir ?? getDefaultChromeUserDataDir(extensionDir, executablePath));
    const extensionId = computeChromiumExtensionId(extensionDir);
    fs.mkdirSync(userDataDir, { recursive: true });
    seedPinnedExtensionState(userDataDir, extensionId);

    const args = buildChromeLaunchArgs(extensionDir, userDataDir, debugPort);
    const child = spawn(executablePath, args, { detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();

    return {
        executablePath,
        executableKind,
        extensionDir,
        extensionId,
        userDataDir,
        debugPort,
        args,
    };
}
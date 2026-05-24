import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';

import {
    AutoLaunchBrowserPlatform,
    ChromiumExecutableKind,
    ResolveChromeExecutableOptions,
    ResolveBrowserExecutableOptions,
    ChromiumPreferencesShape,
    DEFAULT_CHROME_DEBUG_PORT,
    CHROME_EXTENSIONS_PAGE,
    EDGE_EXTENSIONS_PAGE,
    BRAVE_EXTENSIONS_PAGE,
    OPERA_EXTENSIONS_PAGE,
    resolveExecutableFromPath,
    findNewestMatchingExecutable,
    getBrowserOverrideEnvKey,
    getPathCommandCandidates,
    getBrowserDisplayName,
    resolveBrowserOverridePath,
} from './shared';

import {
    resolveFirefoxDebugPort,
    seedFirefoxDevProfile,
    buildFirefoxLaunchArgs,
    clearFirefoxStaleLockFiles,
    getPlatformFirefoxCandidates,
} from './firefox-launcher';

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

export interface LaunchBrowserWithExtensionOptions {
    platform: AutoLaunchBrowserPlatform;
    extensionDir: string;
    executablePath?: string;
    userDataDir?: string;
    debugPort?: number;
    env?: NodeJS.ProcessEnv;
}

export interface LaunchBrowserWithExtensionResult {
    platform: AutoLaunchBrowserPlatform;
    executablePath: string;
    executableKind: ChromiumExecutableKind | 'firefox';
    extensionDir: string;
    extensionId?: string;
    userDataDir: string;
    debugPort?: number;
    args: string[];
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
        const chromeCandidates = roots.map(root => path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'));
        return [...nonBrandedCandidates, ...chromeCandidates];
    }

    if (process.platform === 'darwin') {
        const homeDir = env.HOME || os.homedir();
        const chromeBrandedCandidates = [
            path.join(homeDir, 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        ];
        return [...chromeBrandedCandidates, ...nonBrandedCandidates];
    }

    return [
        ...nonBrandedCandidates,
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
    ];
}

function getPlatformEdgeCandidates(env: NodeJS.ProcessEnv): string[] {
    if (process.platform === 'win32') {
        const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LocalAppData].filter(Boolean) as string[];
        return roots.map(root => path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    }

    if (process.platform === 'darwin') {
        const homeDir = env.HOME || os.homedir();
        return [
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            path.join(homeDir, 'Applications', 'Microsoft Edge.app', 'Contents', 'MacOS', 'Microsoft Edge'),
        ];
    }

    return [
        '/usr/bin/microsoft-edge',
        '/usr/bin/microsoft-edge-stable',
        '/snap/bin/microsoft-edge',
    ];
}

function getPlatformBraveCandidates(env: NodeJS.ProcessEnv): string[] {
    if (process.platform === 'win32') {
        const roots = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LocalAppData].filter(Boolean) as string[];
        return roots.map(root => path.join(root, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'));
    }

    if (process.platform === 'darwin') {
        const homeDir = env.HOME || os.homedir();
        return [
            '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
            path.join(homeDir, 'Applications', 'Brave Browser.app', 'Contents', 'MacOS', 'Brave Browser'),
        ];
    }

    return [
        '/usr/bin/brave-browser',
        '/snap/bin/brave',
    ];
}

function getPlatformOperaCandidates(env: NodeJS.ProcessEnv): string[] {
    if (process.platform === 'win32') {
        return [
            path.join(env.LocalAppData || '', 'Programs', 'Opera', 'launcher.exe'),
            path.join(env.ProgramFiles || '', 'Opera', 'launcher.exe'),
            path.join(env['ProgramFiles(x86)'] || '', 'Opera', 'launcher.exe'),
        ].filter(Boolean);
    }

    if (process.platform === 'darwin') {
        const homeDir = env.HOME || os.homedir();
        return [
            '/Applications/Opera.app/Contents/MacOS/Opera',
            path.join(homeDir, 'Applications', 'Opera.app', 'Contents', 'MacOS', 'Opera'),
        ];
    }

    return [
        '/usr/bin/opera',
        '/snap/bin/opera',
    ];
}

function getPlatformExecutableCandidates(platform: AutoLaunchBrowserPlatform, env: NodeJS.ProcessEnv): string[] {
    if (platform === 'chrome') {
        return getPlatformChromeCandidates(env);
    }

    if (platform === 'edge') {
        return getPlatformEdgeCandidates(env);
    }

    if (platform === 'firefox') {
        return getPlatformFirefoxCandidates(env);
    }

    if (platform === 'opera') {
        return getPlatformOperaCandidates(env);
    }

    return getPlatformBraveCandidates(env);
}

function resolveChromeOverridePath(options: ResolveChromeExecutableOptions): string | null {
    return resolveBrowserOverridePath({ platform: 'chrome', executablePath: options.executablePath, env: options.env });
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

    const executable = resolveExecutableFromPath(getPathCommandCandidates('chrome'), env);
    if (executable) {
        return executable;
    }

    throw new Error('Unable to locate Chrome automatically. Install Chrome or set HEXA_CHROME_PATH to the executable path.');
}

export function resolveBrowserExecutablePath(options: ResolveBrowserExecutableOptions): string {
    const env = options.env ?? process.env;
    const overridePath = resolveBrowserOverridePath(options);
    if (overridePath) {
        return overridePath;
    }

    const candidates = getPlatformExecutableCandidates(options.platform, env);
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    const executable = resolveExecutableFromPath(getPathCommandCandidates(options.platform), env);
    if (executable) {
        return executable;
    }

    const browserName = getBrowserDisplayName(options.platform);
    const overrideKey = getBrowserOverrideEnvKey(options.platform);
    throw new Error(`Unable to locate ${browserName} automatically. Install ${browserName} or set ${overrideKey} to the executable path.`);
}

export function computeChromiumExtensionId(extensionDir: string): string {
    const resolvedPath = process.platform === 'win32' ? path.win32.resolve(extensionDir) : path.resolve(extensionDir);
    const normalizedPath = process.platform === 'win32' && /^[a-z]:/i.test(resolvedPath)
        ? `${resolvedPath.charAt(0).toUpperCase()}${resolvedPath.slice(1)}`
        : resolvedPath;
    const hashInput = process.platform === 'win32' ? Buffer.from(normalizedPath, 'utf16le') : Buffer.from(normalizedPath, 'utf8');
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

function getDefaultBrowserUserDataDir(platform: AutoLaunchBrowserPlatform, extensionDir: string, executablePath: string): string {
    if (platform === 'chrome') {
        return getDefaultChromeUserDataDir(extensionDir, executablePath);
    }

    const profileKey = JSON.stringify({
        platform,
        extensionDir: path.resolve(extensionDir),
        executablePath: path.resolve(executablePath),
    });
    const hash = crypto.createHash('sha1').update(profileKey).digest('hex').slice(0, 12);
    return path.join(os.tmpdir(), 'hexajs', `${platform}-dev-profile`, hash);
}

function getChromiumExtensionsPage(platform: AutoLaunchBrowserPlatform): string {
    if (platform === 'edge') {
        return EDGE_EXTENSIONS_PAGE;
    }

    if (platform === 'brave') {
        return BRAVE_EXTENSIONS_PAGE;
    }

    if (platform === 'opera') {
        return OPERA_EXTENSIONS_PAGE;
    }

    return CHROME_EXTENSIONS_PAGE;
}

function buildChromiumLaunchArgs(platform: AutoLaunchBrowserPlatform, extensionDir: string, userDataDir: string, debugPort: number): string[] {
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
        getChromiumExtensionsPage(platform),
    ];
}

export function buildChromeLaunchArgs(extensionDir: string, userDataDir: string, debugPort: number): string[] {
    return buildChromiumLaunchArgs('chrome', extensionDir, userDataDir, debugPort);
}

function isChromiumPlatform(platform: AutoLaunchBrowserPlatform): boolean {
    return platform === 'chrome' || platform === 'edge' || platform === 'opera' || platform === 'brave';
}

function clearChromiumStaleLockFiles(userDataDir: string): void {
    // Chromium-based browsers use SingletonLock, SingletonSocket, SingletonCookie (Linux/Mac)
    // and lockfile (Windows)
    const lockFiles = process.platform === 'win32'
        ? ['lockfile']
        : ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];
    for (const lockFile of lockFiles) {
        const lockPath = path.join(userDataDir, lockFile);
        try {
            const stat = fs.lstatSync(lockPath);
            if (stat.isSymbolicLink() || stat.isFile()) {
                fs.unlinkSync(lockPath);
            }
        } catch (error: any) {
            // ENOENT means the file doesn't exist — that's fine.
            if (error?.code !== 'ENOENT') {
                // Best-effort: if we can't remove the lock, the browser may still recover.
            }
        }
    }
}

export function launchBrowserWithExtension(options: LaunchBrowserWithExtensionOptions): LaunchBrowserWithExtensionResult {
    const env = options.env ?? process.env;
    const extensionDir = path.resolve(options.extensionDir);
    const platform = options.platform;
    const overrideKey = getBrowserOverrideEnvKey(platform);
    const hasExplicitBrowserOverride = !!(options.executablePath?.trim() || env[overrideKey]?.trim());

    if (!fs.existsSync(extensionDir)) {
        throw new Error(`Extension output directory does not exist: ${extensionDir}`);
    }

    const executablePath = resolveBrowserExecutablePath({ platform, executablePath: options.executablePath, env });
    const userDataDir = path.resolve(options.userDataDir ?? getDefaultBrowserUserDataDir(platform, extensionDir, executablePath));
    fs.mkdirSync(userDataDir, { recursive: true });

    if (platform === 'firefox') {
        clearFirefoxStaleLockFiles(userDataDir);
        const debugPort = resolveFirefoxDebugPort(options.debugPort, env);
        seedFirefoxDevProfile(userDataDir, debugPort);
        const args = buildFirefoxLaunchArgs(userDataDir, debugPort);
        const child = spawn(executablePath, args, { detached: true, stdio: 'ignore', windowsHide: true });
        child.on('error', () => { /* Prevent unhandled spawn errors from crashing the CLI process. */ });
        child.unref();

        return {
            platform,
            executablePath,
            executableKind: 'firefox',
            extensionDir,
            userDataDir,
            debugPort,
            args,
        };
    }

    const executableKind = classifyChromiumExecutable(executablePath);

    const debugPort = resolveChromeDebugPort(options.debugPort, env);
    const extensionId = computeChromiumExtensionId(extensionDir);
    if (isChromiumPlatform(platform)) {
        seedPinnedExtensionState(userDataDir, extensionId);
    }

    clearChromiumStaleLockFiles(userDataDir);
    const args = buildChromiumLaunchArgs(platform, extensionDir, userDataDir, debugPort);
    const child = spawn(executablePath, args, { detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', () => { /* Prevent unhandled spawn errors from crashing the CLI process. */ });
    child.unref();

    return {
        platform,
        executablePath,
        executableKind,
        extensionDir,
        extensionId,
        userDataDir,
        debugPort,
        args,
    };
}

export function launchChromeWithExtension(options: LaunchChromeWithExtensionOptions): LaunchChromeWithExtensionResult {
    const launch = launchBrowserWithExtension({
        platform: 'chrome',
        extensionDir: options.extensionDir,
        executablePath: options.executablePath,
        userDataDir: options.userDataDir,
        debugPort: options.debugPort,
        env: options.env,
    });

    if (launch.executableKind === 'firefox' || !launch.extensionId || !launch.debugPort) {
        throw new Error('Chrome launch did not return required extension metadata.');
    }

    return {
        executablePath: launch.executablePath,
        executableKind: launch.executableKind,
        extensionDir: launch.extensionDir,
        extensionId: launch.extensionId,
        userDataDir: launch.userDataDir,
        debugPort: launch.debugPort,
        args: launch.args,
    };
}

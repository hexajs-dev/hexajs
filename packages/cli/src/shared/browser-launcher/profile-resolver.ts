import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { AutoLaunchBrowserPlatform } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChromiumProfile {
    /** Directory name under user-data-dir, e.g. 'Default', 'Profile 1' */
    dir: string;
    /** Human-readable display name from Local State, e.g. 'Personal', 'Work' */
    displayName: string;
}

export class AmbiguousProfileError extends Error {
    readonly profiles: ChromiumProfile[];
    constructor(profiles: ChromiumProfile[]) {
        const list = profiles.map(p => `  • ${p.dir} — "${p.displayName}"`).join('\n');
        super(
            `Multiple browser profiles found. Specify one using --profile or autoLaunch.profileName:\n${list}\n\n` +
            `Example: --profile "Work"  or  --profile "Default"`
        );
        this.name = 'AmbiguousProfileError';
        this.profiles = profiles;
    }
}

// ─── Task 2: Real user-data-dir per browser per OS ────────────────────────────

export function getRealBrowserUserDataDir(
    platform: AutoLaunchBrowserPlatform,
    env: NodeJS.ProcessEnv = process.env,
): string {
    const home = env.HOME ?? env.USERPROFILE ?? os.homedir();

    if (process.platform === 'win32') {
        const local = env.LOCALAPPDATA ?? env.LocalAppData ?? path.join(home, 'AppData', 'Local');
        if (platform === 'chrome') return path.join(local, 'Google', 'Chrome', 'User Data');
        if (platform === 'edge')   return path.join(local, 'Microsoft', 'Edge', 'User Data');
        if (platform === 'brave')  return path.join(local, 'BraveSoftware', 'Brave-Browser', 'User Data');
        if (platform === 'opera')  return path.join(local, 'Opera Software', 'Opera Stable');
        return path.join(local, 'Google', 'Chrome', 'User Data');
    }

    if (process.platform === 'darwin') {
        const appSupport = path.join(home, 'Library', 'Application Support');
        if (platform === 'chrome') return path.join(appSupport, 'Google', 'Chrome');
        if (platform === 'edge')   return path.join(appSupport, 'Microsoft Edge');
        if (platform === 'brave')  return path.join(appSupport, 'BraveSoftware', 'Brave-Browser');
        if (platform === 'opera')  return path.join(appSupport, 'com.operasoftware.Opera');
        return path.join(appSupport, 'Google', 'Chrome');
    }

    // Linux
    const configDir = env.XDG_CONFIG_HOME ?? path.join(home, '.config');
    if (platform === 'chrome') return path.join(configDir, 'google-chrome');
    if (platform === 'edge')   return path.join(configDir, 'microsoft-edge');
    if (platform === 'brave')  return path.join(configDir, 'BraveSoftware', 'Brave-Browser');
    if (platform === 'opera')  return path.join(configDir, 'opera');
    return path.join(configDir, 'google-chrome');
}

// ─── Task 3: Profile detection from Local State ───────────────────────────────

interface LocalStateJson {
    profile?: {
        info_cache?: Record<string, { name?: string }>;
    };
}

function readLocalState(userDataDir: string): LocalStateJson {
    try {
        const raw = fs.readFileSync(path.join(userDataDir, 'Local State'), 'utf-8');
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

function scanProfileDirs(userDataDir: string): string[] {
    try {
        return fs.readdirSync(userDataDir, { withFileTypes: true })
            .filter(e => e.isDirectory() && (e.name === 'Default' || /^Profile \d+$/.test(e.name)))
            .map(e => e.name);
    } catch {
        return [];
    }
}

export function listChromiumProfiles(userDataDir: string): ChromiumProfile[] {
    const infoCache = readLocalState(userDataDir).profile?.info_cache;
    if (infoCache && typeof infoCache === 'object') {
        return Object.entries(infoCache).map(([dir, info]) => ({
            dir,
            displayName: info?.name ?? dir,
        }));
    }
    return scanProfileDirs(userDataDir).map(dir => ({ dir, displayName: dir }));
}

/**
 * Resolves the Chromium --profile-directory value to use.
 *
 * - `requested` matches a dir or display name → return it.
 * - `requested` empty, one profile → return it.
 * - `requested` empty, multiple profiles → throw AmbiguousProfileError.
 * - No profiles detected → return 'Default' (fresh install).
 */
export function resolveChromiumProfileDirectory(opts: {
    userDataDir: string;
    requested?: string;
}): string {
    const profiles = listChromiumProfiles(opts.userDataDir);
    const requested = opts.requested?.trim() ?? '';

    if (!requested) {
        if (profiles.length <= 1) return profiles[0]?.dir ?? 'Default';
        throw new AmbiguousProfileError(profiles);
    }

    const byDir  = profiles.find(p => p.dir.toLowerCase()         === requested.toLowerCase());
    if (byDir)  return byDir.dir;
    const byName = profiles.find(p => p.displayName.toLowerCase() === requested.toLowerCase());
    if (byName) return byName.dir;

    const list = profiles.map(p => `  • ${p.dir} — "${p.displayName}"`).join('\n');
    throw new Error(`Profile "${requested}" not found.\nAvailable profiles:\n${list}`);
}

// ─── Task 4: Running / lock detection ─────────────────────────────────────────

/**
 * Best-effort: returns true if a Chromium browser is likely running on
 * this user-data-dir, false if free or detection is inconclusive.
 */
export function isChromiumProfileInUse(userDataDir: string): boolean {
    if (process.platform === 'win32') {
        const lockPath = path.join(userDataDir, 'lockfile');
        try {
            const fd = fs.openSync(lockPath, 'r+');
            fs.closeSync(fd);
            return false;
        } catch (e: any) {
            if (e?.code === 'ENOENT') return false;
            return true; // EBUSY / EPERM / EACCES → locked by browser
        }
    }

    // mac / linux: SingletonLock is a symlink present while Chrome is running
    try {
        fs.lstatSync(path.join(userDataDir, 'SingletonLock'));
        return true;
    } catch (e: any) {
        return false; // ENOENT or detection failure → treat as free
    }
}

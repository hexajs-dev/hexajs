import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    AmbiguousProfileError,
    getRealBrowserUserDataDir,
    isChromiumProfileInUse,
    listChromiumProfiles,
    resolveChromiumProfileDirectory,
} from '../src/shared/browser-launcher/profile-resolver';

const tempDirs: string[] = [];
function mkTmp(prefix = 'hexa-profile-test-'): string {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    tempDirs.push(d);
    return d;
}

afterEach(() => {
    vi.restoreAllMocks();
    for (const d of tempDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

// ─── Task 2: getRealBrowserUserDataDir ────────────────────────────────────────

describe('getRealBrowserUserDataDir', () => {
    it('Windows Chrome → %LOCALAPPDATA%/Google/Chrome/User Data', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
        const env = { LOCALAPPDATA: 'C:\\Users\\user\\AppData\\Local' };
        expect(getRealBrowserUserDataDir('chrome', env as any)).toBe(
            path.join('C:\\Users\\user\\AppData\\Local', 'Google', 'Chrome', 'User Data')
        );
    });

    it('Windows Edge → %LOCALAPPDATA%/Microsoft/Edge/User Data', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
        const env = { LOCALAPPDATA: 'C:\\Users\\user\\AppData\\Local' };
        expect(getRealBrowserUserDataDir('edge', env as any)).toContain(path.join('Microsoft', 'Edge', 'User Data'));
    });

    it('Windows Brave → %LOCALAPPDATA%/BraveSoftware/Brave-Browser/User Data', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
        const env = { LOCALAPPDATA: 'C:\\Users\\user\\AppData\\Local' };
        expect(getRealBrowserUserDataDir('brave', env as any)).toContain(path.join('BraveSoftware', 'Brave-Browser', 'User Data'));
    });

    it('macOS Chrome → ~/Library/Application Support/Google/Chrome', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
        const env = { HOME: '/Users/user' };
        expect(getRealBrowserUserDataDir('chrome', env as any)).toBe(
            path.join('/Users/user', 'Library', 'Application Support', 'Google', 'Chrome')
        );
    });

    it('macOS Edge → ~/Library/Application Support/Microsoft Edge', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
        const env = { HOME: '/Users/user' };
        expect(getRealBrowserUserDataDir('edge', env as any)).toContain('Microsoft Edge');
    });

    it('Linux Chrome → ~/.config/google-chrome', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
        const env = { HOME: '/home/user' };
        expect(getRealBrowserUserDataDir('chrome', env as any)).toBe(
            path.join('/home/user', '.config', 'google-chrome')
        );
    });

    it('Linux Brave uses XDG_CONFIG_HOME when set', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
        const env = { XDG_CONFIG_HOME: '/custom/config' };
        expect(getRealBrowserUserDataDir('brave', env as any)).toBe(
            path.join('/custom/config', 'BraveSoftware', 'Brave-Browser')
        );
    });
});

// ─── Task 3: listChromiumProfiles + resolveChromiumProfileDirectory ───────────

function writeLocalState(dir: string, infoCache: Record<string, { name: string }>): void {
    fs.writeFileSync(path.join(dir, 'Local State'), JSON.stringify({ profile: { info_cache: infoCache } }), 'utf-8');
}

describe('listChromiumProfiles', () => {
    it('returns profiles from Local State info_cache', () => {
        const udd = mkTmp();
        writeLocalState(udd, { Default: { name: 'Personal' }, 'Profile 1': { name: 'Work' } });
        const profiles = listChromiumProfiles(udd);
        expect(profiles).toHaveLength(2);
        expect(profiles.find(p => p.dir === 'Default')?.displayName).toBe('Personal');
        expect(profiles.find(p => p.dir === 'Profile 1')?.displayName).toBe('Work');
    });

    it('falls back to dir scan when Local State is absent', () => {
        const udd = mkTmp();
        fs.mkdirSync(path.join(udd, 'Default'));
        fs.mkdirSync(path.join(udd, 'Profile 1'));
        const profiles = listChromiumProfiles(udd);
        expect(profiles.map(p => p.dir).sort()).toEqual(['Default', 'Profile 1']);
    });

    it('falls back to dir scan when Local State is corrupt', () => {
        const udd = mkTmp();
        fs.writeFileSync(path.join(udd, 'Local State'), 'not-json', 'utf-8');
        fs.mkdirSync(path.join(udd, 'Default'));
        const profiles = listChromiumProfiles(udd);
        expect(profiles[0].dir).toBe('Default');
    });

    it('returns empty array when user-data-dir is empty/non-existent', () => {
        const profiles = listChromiumProfiles('/does/not/exist/at/all');
        expect(profiles).toEqual([]);
    });
});

describe('resolveChromiumProfileDirectory', () => {
    it('returns the only profile when no name is requested', () => {
        const udd = mkTmp();
        writeLocalState(udd, { Default: { name: 'Personal' } });
        expect(resolveChromiumProfileDirectory({ userDataDir: udd })).toBe('Default');
    });

    it('throws AmbiguousProfileError when multiple profiles exist and none requested', () => {
        const udd = mkTmp();
        writeLocalState(udd, { Default: { name: 'Personal' }, 'Profile 1': { name: 'Work' } });
        expect(() => resolveChromiumProfileDirectory({ userDataDir: udd }))
            .toThrow(AmbiguousProfileError);
    });

    it('resolves by exact dir name (case-insensitive)', () => {
        const udd = mkTmp();
        writeLocalState(udd, { Default: { name: 'Personal' }, 'Profile 1': { name: 'Work' } });
        expect(resolveChromiumProfileDirectory({ userDataDir: udd, requested: 'profile 1' })).toBe('Profile 1');
    });

    it('resolves by display name (case-insensitive)', () => {
        const udd = mkTmp();
        writeLocalState(udd, { Default: { name: 'Personal' }, 'Profile 1': { name: 'Work' } });
        expect(resolveChromiumProfileDirectory({ userDataDir: udd, requested: 'work' })).toBe('Profile 1');
    });

    it('throws descriptive error when requested name does not match any profile', () => {
        const udd = mkTmp();
        writeLocalState(udd, { Default: { name: 'Personal' } });
        expect(() => resolveChromiumProfileDirectory({ userDataDir: udd, requested: 'Nonexistent' }))
            .toThrow(/not found/);
    });

    it('returns Default when no profiles are detected (fresh install)', () => {
        const udd = mkTmp();
        expect(resolveChromiumProfileDirectory({ userDataDir: udd })).toBe('Default');
    });
});

// ─── Task 4: isChromiumProfileInUse ──────────────────────────────────────────

describe('isChromiumProfileInUse', () => {
    it('returns false when no lock file exists (linux/mac path)', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
        const udd = mkTmp();
        expect(isChromiumProfileInUse(udd)).toBe(false);
    });

    it('returns true when SingletonLock exists (linux/mac)', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('linux');
        const udd = mkTmp();
        fs.writeFileSync(path.join(udd, 'SingletonLock'), '', 'utf-8');
        expect(isChromiumProfileInUse(udd)).toBe(true);
    });

    it('returns false when lockfile is absent (windows)', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
        const udd = mkTmp();
        expect(isChromiumProfileInUse(udd)).toBe(false);
    });

    it('returns false when lockfile exists and is openable (windows, browser not running)', () => {
        vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
        const udd = mkTmp();
        fs.writeFileSync(path.join(udd, 'lockfile'), '', 'utf-8');
        expect(isChromiumProfileInUse(udd)).toBe(false);
    });
});

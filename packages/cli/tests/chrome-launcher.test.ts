import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const childProcessMocks = vi.hoisted(() => ({
  execFileSync: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock('child_process', () => ({
  execFileSync: childProcessMocks.execFileSync,
  spawn: childProcessMocks.spawn,
}));

import { buildChromeLaunchArgs, classifyChromiumExecutable, computeChromiumExtensionId, launchChromeWithExtension, resolveChromeDebugPort, resolveChromeExecutablePath } from '../src/shared/chrome-launcher';

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function writeExecutable(filePath: string): string {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, '', 'utf-8');
  return filePath;
}

afterEach(() => {
  vi.restoreAllMocks();
  childProcessMocks.execFileSync.mockReset();
  childProcessMocks.spawn.mockReset();

  for (const tempDir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('chrome launcher', () => {
  it('prefers HEXA_CHROME_PATH when provided', () => {
    const root = createTempDir('hexa-chrome-override-');
    const chromePath = writeExecutable(path.join(root, 'chrome', 'chrome.exe'));

    const resolved = resolveChromeExecutablePath({ env: { ...process.env, HEXA_CHROME_PATH: chromePath } });

    expect(path.normalize(resolved).toLowerCase()).toBe(path.normalize(chromePath).toLowerCase());
  });

  it('auto-detects Chrome on Windows ProgramFiles locations', () => {
    const windowsRoot = createTempDir('hexa-win-pf-');
    const chromePath = writeExecutable(path.join(windowsRoot, 'Google', 'Chrome', 'Application', 'chrome.exe'));

    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');

    const resolved = resolveChromeExecutablePath({
      env: {
        ...process.env,
        ProgramFiles: windowsRoot,
        'ProgramFiles(x86)': '',
        LocalAppData: '',
        USERPROFILE: windowsRoot,
        SystemRoot: windowsRoot,
        WINDIR: windowsRoot,
      },
    });

    expect(path.normalize(resolved).toLowerCase()).toBe(path.normalize(chromePath).toLowerCase());
  });

  it('prefers a discovered non-branded Chromium build over Google Chrome on Windows', () => {
    const userRoot = createTempDir('hexa-user-root-');
    const codeiumChrome = writeExecutable(path.join(userRoot, '.codeium', 'ws-browser', 'chromium-1155', 'chrome-win', 'chrome.exe'));
    writeExecutable(path.join(userRoot, 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'));

    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');

    const resolved = resolveChromeExecutablePath({
      env: {
        ...process.env,
        USERPROFILE: userRoot,
        ProgramFiles: path.join(userRoot, 'Program Files'),
        'ProgramFiles(x86)': '',
        LocalAppData: path.join(userRoot, 'AppData', 'Local'),
        SystemRoot: userRoot,
        WINDIR: userRoot,
      },
    });

    expect(path.normalize(resolved).toLowerCase()).toBe(path.normalize(codeiumChrome).toLowerCase());
  });

  it('auto-detects Chrome on macOS HOME Applications path', () => {
    const homeRoot = createTempDir('hexa-macos-home-');
    const chromePath = writeExecutable(path.join(homeRoot, 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'));

    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');

    const resolved = resolveChromeExecutablePath({ env: { ...process.env, HOME: homeRoot } });

    expect(path.normalize(resolved)).toBe(path.normalize(chromePath));
  });

  it('parses debug port from HEXA_CHROMIUM_DEBUG_ENDPOINT', () => {
    const port = resolveChromeDebugPort(undefined, { ...process.env, HEXA_CHROMIUM_DEBUG_ENDPOINT: 'http://127.0.0.1:9333' });
    expect(port).toBe(9333);
  });

  it('builds required Chrome extension flags', () => {
    const extensionDir = path.join('project', 'dist', 'chrome', 'development');
    const userDataDir = path.join('tmp', 'chrome-profile');
    const args = buildChromeLaunchArgs(extensionDir, userDataDir, 9222);

    expect(args).toContain(`--disable-extensions-except=${path.resolve(extensionDir)}`);
    expect(args).toContain(`--load-extension=${path.resolve(extensionDir)}`);
    expect(args).toContain('--remote-debugging-port=9222');
    expect(args).toContain(`--user-data-dir=${path.resolve(userDataDir)}`);
    expect(args).toContain('--enable-unsafe-extension-debugging');
    expect(args).toContain('chrome://extensions/');
  });

  it('computes the Chromium unpacked extension id from path', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    const extensionId = computeChromiumExtensionId('D:/GitHub/hexajs/examples/clip-volt/dist/chrome/dev');
    expect(extensionId).toBe('nhhligopnhmgjjlbkbokcoldodmnmpji');
  });

  it('classifies branded Google Chrome separately from Chromium-like binaries', () => {
    expect(classifyChromiumExecutable('C:/Program Files/Google/Chrome/Application/chrome.exe')).toBe('google-chrome');
    expect(classifyChromiumExecutable('C:/Users/test/.codeium/ws-browser/chromium-1155/chrome-win/chrome.exe')).toBe('chromium-like');
  });

  it('launches Chrome detached with isolated profile', () => {
    const root = createTempDir('hexa-launch-');
    const extensionDir = path.join(root, 'dist', 'chrome', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const chromePath = writeExecutable(path.join(root, 'chrome', 'chrome.exe'));
    const unref = vi.fn();

    childProcessMocks.spawn.mockReturnValue({ unref } as any);

    const result = launchChromeWithExtension({
      extensionDir,
      executablePath: chromePath,
      env: { ...process.env },
    });

    expect(childProcessMocks.spawn).toHaveBeenCalledTimes(1);
    expect(childProcessMocks.spawn).toHaveBeenCalledWith(
      chromePath,
      expect.arrayContaining([
        `--disable-extensions-except=${path.resolve(extensionDir)}`,
        `--load-extension=${path.resolve(extensionDir)}`,
      ]),
      { detached: true, stdio: 'ignore', windowsHide: true },
    );
    expect(fs.existsSync(result.userDataDir)).toBe(true);
    const preferencesPath = path.join(result.userDataDir, 'Default', 'Preferences');
    const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
    expect(preferences.extensions.pinned_extensions).toContain(result.extensionId);
    expect(preferences.toolbar.pinned_actions).toContain(result.extensionId);
    expect(unref).toHaveBeenCalledTimes(1);
  });

  it('uses a different default dev profile for different browser executables', () => {
    const root = createTempDir('hexa-launch-profile-');
    const extensionDir = path.join(root, 'dist', 'chrome', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const chromiumPath = writeExecutable(path.join(root, 'chromium', 'chrome.exe'));
    const chromePath = writeExecutable(path.join(root, 'google-chrome', 'chrome.exe'));
    const unref = vi.fn();

    childProcessMocks.spawn.mockReturnValue({ unref } as any);

    const chromiumLaunch = launchChromeWithExtension({ extensionDir, executablePath: chromiumPath, env: { ...process.env } });
    const chromeLaunch = launchChromeWithExtension({ extensionDir, executablePath: chromePath, env: { ...process.env } });

    expect(chromiumLaunch.userDataDir).not.toBe(chromeLaunch.userDataDir);
    expect(fs.existsSync(chromiumLaunch.userDataDir)).toBe(true);
    expect(fs.existsSync(chromeLaunch.userDataDir)).toBe(true);
  });

  it('rejects branded Google Chrome by default when no compatible browser override is provided', () => {
    const root = createTempDir('hexa-google-chrome-');
    const extensionDir = path.join(root, 'dist', 'chrome', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const googleChromePath = writeExecutable(path.join(root, 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'));

    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');

    expect(() => launchChromeWithExtension({
      extensionDir,
      env: {
        ...process.env,
        ProgramFiles: path.join(root, 'Program Files'),
        'ProgramFiles(x86)': '',
        LocalAppData: '',
        USERPROFILE: root,
        SystemRoot: root,
        WINDIR: root,
      },
    })).toThrow(/Google Chrome blocks --load-extension/i);

    expect(fs.existsSync(googleChromePath)).toBe(true);
  });
});
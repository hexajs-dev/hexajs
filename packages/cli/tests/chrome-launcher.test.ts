import * as fs from 'fs';
import * as fs from 'fs';
import * as net from 'net';
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

import { buildChromeLaunchArgs, classifyChromiumExecutable, computeChromiumExtensionId, installFirefoxAddonOverRDP, launchBrowserWithExtension, launchChromeWithExtension, resolveBrowserExecutablePath, resolveChromeDebugPort, resolveChromeExecutablePath, resolveFirefoxDebugPort } from '../src/shared/chrome-launcher';

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

  it('prefers Google Chrome over a discovered non-branded Chromium build on Windows', () => {
    const userRoot = createTempDir('hexa-user-root-');
    writeExecutable(path.join(userRoot, '.codeium', 'ws-browser', 'chromium-1155', 'chrome-win', 'chrome.exe'));
    const realChrome = writeExecutable(path.join(userRoot, 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'));

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

    expect(path.normalize(resolved).toLowerCase()).toBe(path.normalize(realChrome).toLowerCase());
  });

  it('falls back to a discovered non-branded Chromium build when Google Chrome is absent on Windows', () => {
    const userRoot = createTempDir('hexa-user-root-');
    const codeiumChrome = writeExecutable(path.join(userRoot, '.codeium', 'ws-browser', 'chromium-1155', 'chrome-win', 'chrome.exe'));
    // No real Chrome installed.

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

  it('resolves Edge executable paths with HEXA_EDGE_PATH override', () => {
    const root = createTempDir('hexa-edge-override-');
    const edgePath = writeExecutable(path.join(root, 'edge', 'msedge.exe'));

    const resolved = resolveBrowserExecutablePath({ platform: 'edge', env: { ...process.env, HEXA_EDGE_PATH: edgePath } });

    expect(path.normalize(resolved).toLowerCase()).toBe(path.normalize(edgePath).toLowerCase());
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

  it('falls back to default port for non-loopback HEXA_CHROMIUM_DEBUG_ENDPOINT', () => {
    const port = resolveChromeDebugPort(undefined, { ...process.env, HEXA_CHROMIUM_DEBUG_ENDPOINT: 'http://192.168.1.100:9333' });
    expect(port).toBe(9222);
  });

  it('falls back to default port for invalid endpoint URL', () => {
    const port = resolveChromeDebugPort(undefined, { ...process.env, HEXA_CHROMIUM_DEBUG_ENDPOINT: 'not-a-url' });
    expect(port).toBe(9222);
  });

  it('falls back to default port for endpoint with invalid port', () => {
    const port = resolveChromeDebugPort(undefined, { ...process.env, HEXA_CHROMIUM_DEBUG_ENDPOINT: 'http://127.0.0.1:99999' });
    expect(port).toBe(9222);
  });

  it('builds required Chrome extension flags', () => {
    const extensionDir = path.join('project', 'dist', 'chrome', 'development');
    const userDataDir = path.join('tmp', 'chrome-profile');
    const args = buildChromeLaunchArgs(extensionDir, userDataDir, 9222);

    expect(args).toContain('--remote-debugging-pipe');
    expect(args).toContain('--remote-debugging-port=9222');
    expect(args).toContain(`--user-data-dir=${path.resolve(userDataDir)}`);
    expect(args).toContain('--enable-unsafe-extension-debugging');
    expect(args).toContain('chrome://extensions/');
    // Chrome 137+ removed --load-extension from branded builds; pipe-based loading is used instead
    expect(args.some(a => a.startsWith('--load-extension='))).toBe(false);
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

    childProcessMocks.spawn.mockReturnValue({ unref, on: vi.fn(), stdio: [null, null, null, null, null] } as any);

    const result = launchChromeWithExtension({
      extensionDir,
      executablePath: chromePath,
      env: { ...process.env },
    });

    expect(childProcessMocks.spawn).toHaveBeenCalledTimes(1);
    expect(childProcessMocks.spawn).toHaveBeenCalledWith(
      chromePath,
      expect.arrayContaining([
        '--remote-debugging-pipe',
        '--enable-unsafe-extension-debugging',
      ]),
      { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true },
    );
    expect(fs.existsSync(result.userDataDir)).toBe(true);
    const preferencesPath = path.join(result.userDataDir, 'Default', 'Preferences');
    const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
    expect(preferences.extensions.pinned_extensions).toContain(result.extensionId);
    expect(preferences.toolbar.pinned_actions).toContain(result.extensionId);
  });

  it('launches Edge with unpacked extension flags', () => {
    const root = createTempDir('hexa-edge-launch-');
    const extensionDir = path.join(root, 'dist', 'edge', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const edgePath = writeExecutable(path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    const unref = vi.fn();
    childProcessMocks.spawn.mockReturnValue({ unref, on: vi.fn() } as any);

    const result = launchBrowserWithExtension({
      platform: 'edge',
      extensionDir,
      executablePath: edgePath,
      env: { ...process.env },
    });

    expect(result.platform).toBe('edge');
    expect(result.args).toContain('edge://extensions/');
    expect(result.args).toContain(`--load-extension=${path.resolve(extensionDir)}`);
    expect(unref).toHaveBeenCalledTimes(1);
  });

  it('launches Firefox with isolated profile, debugger flag, and seeded user.js', () => {
    const root = createTempDir('hexa-firefox-launch-');
    const extensionDir = path.join(root, 'dist', 'firefox', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    fs.writeFileSync(path.join(extensionDir, 'manifest.json'), JSON.stringify({
      manifest_version: 3,
      name: 'test-ext',
      version: '1.0',
      browser_specific_settings: { gecko: { id: 'test@hexajs.dev' } },
    }), 'utf-8');
    const firefoxPath = writeExecutable(path.join(root, 'Mozilla Firefox', 'firefox.exe'));
    const unref = vi.fn();
    childProcessMocks.spawn.mockReturnValue({ unref, on: vi.fn() } as any);

    const result = launchBrowserWithExtension({
      platform: 'firefox',
      extensionDir,
      executablePath: firefoxPath,
      env: { ...process.env, HEXA_FIREFOX_RDP_PORT: '6555' },
    });

    expect(result.platform).toBe('firefox');
    expect(result.executableKind).toBe('firefox');
    expect(result.debugPort).toBe(6555);
    // No --load-extension and no proxy install file are used.
    expect(result.args.some(arg => arg.startsWith('--load-extension='))).toBe(false);
    expect(fs.existsSync(path.join(result.userDataDir, 'extensions', 'test@hexajs.dev'))).toBe(false);
    // The launch arguments enable the remote debugger on the resolved port.
    expect(result.args).toContain('-no-remote');
    expect(result.args).toContain('-profile');
    expect(result.args).toContain(path.resolve(result.userDataDir));
    expect(result.args).toContain('-start-debugger-server');
    expect(result.args).toContain('6555');
    expect(result.args).toContain('about:debugging#/runtime/this-firefox');
    // user.js is written with the prefs needed to enable the RDP server without prompting.
    const userPrefs = fs.readFileSync(path.join(result.userDataDir, 'user.js'), 'utf-8');
    expect(userPrefs).toContain('user_pref("devtools.debugger.remote-enabled", true);');
    expect(userPrefs).toContain('user_pref("devtools.debugger.prompt-connection", false);');
    expect(userPrefs).toContain('user_pref("devtools.debugger.remote-port", 6555);');
    expect(userPrefs).toContain('user_pref("xpinstall.signatures.required", false);');
    expect(unref).toHaveBeenCalledTimes(1);
  });

  it('resolves the Firefox debug port from explicit option, env, then default', () => {
    expect(resolveFirefoxDebugPort(7100, {})).toBe(7100);
    expect(resolveFirefoxDebugPort(undefined, { HEXA_FIREFOX_RDP_PORT: '7200' })).toBe(7200);
    expect(resolveFirefoxDebugPort(undefined, {})).toBe(6000);
  });

  it('uses a different default dev profile for different browser executables', () => {
    const root = createTempDir('hexa-launch-profile-');
    const extensionDir = path.join(root, 'dist', 'chrome', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const chromiumPath = writeExecutable(path.join(root, 'chromium', 'chrome.exe'));
    const chromePath = writeExecutable(path.join(root, 'google-chrome', 'chrome.exe'));
    const unref = vi.fn();

    childProcessMocks.spawn.mockReturnValue({ unref, on: vi.fn(), stdio: [null, null, null, null, null] } as any);

    const chromiumLaunch = launchChromeWithExtension({ extensionDir, executablePath: chromiumPath, env: { ...process.env } });
    const chromeLaunch = launchChromeWithExtension({ extensionDir, executablePath: chromePath, env: { ...process.env } });

    expect(chromiumLaunch.userDataDir).not.toBe(chromeLaunch.userDataDir);
    expect(fs.existsSync(chromiumLaunch.userDataDir)).toBe(true);
    expect(fs.existsSync(chromeLaunch.userDataDir)).toBe(true);
  });

  it('launches branded Google Chrome with --enable-unsafe-extension-debugging', () => {
    const root = createTempDir('hexa-google-chrome-');
    const extensionDir = path.join(root, 'dist', 'chrome', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const googleChromePath = writeExecutable(path.join(root, 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'));
    const unref = vi.fn();
    childProcessMocks.spawn.mockReturnValue({ unref, on: vi.fn(), stdio: [null, null, null, null, null] } as any);

    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');

    const result = launchChromeWithExtension({
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
    });

    expect(result.executableKind).toBe('google-chrome');
    expect(result.args).toContain('--enable-unsafe-extension-debugging');
    expect(result.args).toContain('--remote-debugging-pipe');
    expect(fs.existsSync(googleChromePath)).toBe(true);
  });

  it('allows branded Google Chrome when explicitly overridden', () => {
    const root = createTempDir('hexa-google-chrome-explicit-');
    const extensionDir = path.join(root, 'dist', 'chrome', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const googleChromePath = writeExecutable(path.join(root, 'Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'));
    const unref = vi.fn();
    childProcessMocks.spawn.mockReturnValue({ unref, on: vi.fn(), stdio: [null, null, null, null, null] } as any);

    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');

    expect(() => launchChromeWithExtension({
      extensionDir,
      executablePath: googleChromePath,
      env: { ...process.env },
    })).not.toThrow();
  });

  it('clears stale Chromium lock files before launching Chrome', () => {
    const root = createTempDir('hexa-chrome-lock-');
    const extensionDir = path.join(root, 'dist', 'chrome', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const chromePath = writeExecutable(path.join(root, 'chrome', 'chrome.exe'));
    const unref = vi.fn();
    childProcessMocks.spawn.mockReturnValue({ unref, on: vi.fn(), stdio: [null, null, null, null, null] } as any);

    // Launch once to create the userDataDir
    const firstLaunch = launchChromeWithExtension({
      extensionDir,
      executablePath: chromePath,
      env: { ...process.env },
    });

    // Simulate a stale lock file left by a crashed Chrome instance
    const lockFilePath = path.join(firstLaunch.userDataDir, process.platform === 'win32' ? 'lockfile' : 'SingletonLock');
    fs.writeFileSync(lockFilePath, 'stale-lock-content', 'utf-8');
    expect(fs.existsSync(lockFilePath)).toBe(true);

    // Launch again — the stale lock should be cleared
    launchChromeWithExtension({
      extensionDir,
      executablePath: chromePath,
      env: { ...process.env },
    });

    expect(fs.existsSync(lockFilePath)).toBe(false);
  });

  it('clears stale Firefox lock files before launching Firefox', () => {
    const root = createTempDir('hexa-firefox-lock-');
    const extensionDir = path.join(root, 'dist', 'firefox', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    fs.writeFileSync(path.join(extensionDir, 'manifest.json'), JSON.stringify({
      manifest_version: 3,
      name: 'test-ext',
      version: '1.0',
      browser_specific_settings: { gecko: { id: 'lock-test@hexajs.dev' } },
    }), 'utf-8');
    const firefoxPath = writeExecutable(path.join(root, 'Mozilla Firefox', 'firefox.exe'));
    const unref = vi.fn();
    childProcessMocks.spawn.mockReturnValue({ unref, on: vi.fn() } as any);

    // Launch once to create the userDataDir
    const firstLaunch = launchBrowserWithExtension({
      platform: 'firefox',
      extensionDir,
      executablePath: firefoxPath,
      env: { ...process.env },
    });

    // Simulate stale Firefox lock files left by a crashed instance
    const parentLock = path.join(firstLaunch.userDataDir, 'parent.lock');
    const dotParentLock = path.join(firstLaunch.userDataDir, '.parentlock');
    fs.writeFileSync(parentLock, 'stale', 'utf-8');
    fs.writeFileSync(dotParentLock, '', 'utf-8');
    expect(fs.existsSync(parentLock)).toBe(true);
    expect(fs.existsSync(dotParentLock)).toBe(true);

    // Launch again — the stale locks should be cleared
    launchBrowserWithExtension({
      platform: 'firefox',
      extensionDir,
      executablePath: firefoxPath,
      env: { ...process.env },
    });

    expect(fs.existsSync(parentLock)).toBe(false);
    expect(fs.existsSync(dotParentLock)).toBe(false);
  });

  it('attaches error handler on spawned child process to prevent CLI crash', () => {
    const root = createTempDir('hexa-spawn-error-');
    const extensionDir = path.join(root, 'dist', 'chrome', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    const chromePath = writeExecutable(path.join(root, 'chrome', 'chrome.exe'));
    const unref = vi.fn();
    const on = vi.fn();
    childProcessMocks.spawn.mockReturnValue({ unref, on, stdio: [null, null, null, null, null] } as any);

    launchChromeWithExtension({
      extensionDir,
      executablePath: chromePath,
      env: { ...process.env },
    });

    expect(on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('attaches error handler on spawned Firefox child process', () => {
    const root = createTempDir('hexa-firefox-spawn-error-');
    const extensionDir = path.join(root, 'dist', 'firefox', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });
    fs.writeFileSync(path.join(extensionDir, 'manifest.json'), JSON.stringify({
      manifest_version: 3,
      name: 'test-ext',
      version: '1.0',
      browser_specific_settings: { gecko: { id: 'error-test@hexajs.dev' } },
    }), 'utf-8');
    const firefoxPath = writeExecutable(path.join(root, 'Mozilla Firefox', 'firefox.exe'));
    const unref = vi.fn();
    const on = vi.fn();
    childProcessMocks.spawn.mockReturnValue({ unref, on } as any);

    launchBrowserWithExtension({
      platform: 'firefox',
      extensionDir,
      executablePath: firefoxPath,
      env: { ...process.env },
    });

    expect(on).toHaveBeenCalledWith('error', expect.any(Function));
  });
});

describe('installFirefoxAddonOverRDP', () => {
  function encodeFrame(payload: object): string {
    const json = JSON.stringify(payload);
    const length = Buffer.byteLength(json, 'utf-8');
    return `${length}:${json}`;
  }

  function readFrames(buffer: { value: Buffer }): object[] {
    const frames: object[] = [];
    while (buffer.value.length > 0) {
      const colon = buffer.value.indexOf(0x3a);
      if (colon === -1) break;
      const length = Number.parseInt(buffer.value.subarray(0, colon).toString('ascii'), 10);
      if (!Number.isFinite(length) || buffer.value.length < colon + 1 + length) break;
      const body = buffer.value.subarray(colon + 1, colon + 1 + length).toString('utf-8');
      buffer.value = buffer.value.subarray(colon + 1 + length);
      frames.push(JSON.parse(body));
    }
    return frames;
  }

  function startMockRdpServer(handler: (received: any[], socket: net.Socket) => Iterable<object> | Promise<Iterable<object>>): Promise<{ port: number; close: () => Promise<void>; received: any[] }> {
    return new Promise((resolve, reject) => {
      const received: any[] = [];
      const server = net.createServer(async socket => {
        const buffer = { value: Buffer.alloc(0) };
        const greeting = encodeFrame({ from: 'root', applicationType: 'browser', traits: {} });
        socket.write(greeting);
        socket.on('data', async chunk => {
          buffer.value = Buffer.concat([buffer.value, chunk]);
          const frames = readFrames(buffer);
          for (const frame of frames) {
            received.push(frame);
            const responses = await handler([...received], socket);
            for (const response of responses) {
              socket.write(encodeFrame(response));
            }
          }
        });
      });

      server.on('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (typeof address === 'object' && address && 'port' in address) {
          resolve({
            port: address.port,
            received,
            close: () => new Promise<void>(resolveClose => server.close(() => resolveClose())),
          });
        } else {
          server.close();
          reject(new Error('Failed to bind mock RDP server.'));
        }
      });
    });
  }

  it('installs the extension as a temporary add-on through the RDP protocol', async () => {
    const root = createTempDir('hexa-firefox-rdp-');
    const extensionDir = path.join(root, 'dist', 'firefox', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });

    const server = await startMockRdpServer(async (received, _socket) => {
      const last = received[received.length - 1];
      if (last?.type === 'getRoot') {
        return [{ from: 'root', addonsActor: 'addonsActor1' }];
      }
      if (last?.type === 'installTemporaryAddon') {
        return [{
          from: 'addonsActor1',
          addon: {
            id: 'sample@hexajs.dev',
            actor: 'addonActor1',
            temporarilyInstalled: true,
            manifestURL: `file://${path.resolve(extensionDir).replace(/\\/g, '/')}/manifest.json`,
          },
        }];
      }
      return [];
    });

    try {
      const result = await installFirefoxAddonOverRDP({
        extensionDir,
        port: server.port,
        connectIntervalMs: 25,
        connectTimeoutMs: 2_000,
        requestTimeoutMs: 2_000,
      });

      expect(result.addonId).toBe('sample@hexajs.dev');
      expect(result.temporarilyInstalled).toBe(true);
      expect(result.port).toBe(server.port);
      const installRequest = server.received.find(message => message.type === 'installTemporaryAddon');
      expect(installRequest).toEqual(expect.objectContaining({
        type: 'installTemporaryAddon',
        addonPath: path.resolve(extensionDir),
      }));
    } finally {
      await server.close();
    }
  });

  it('rejects with a clear error when Firefox refuses the install', async () => {
    const root = createTempDir('hexa-firefox-rdp-error-');
    const extensionDir = path.join(root, 'dist', 'firefox', 'development');
    fs.mkdirSync(extensionDir, { recursive: true });

    const server = await startMockRdpServer(async (received, _socket) => {
      const last = received[received.length - 1];
      if (last?.type === 'getRoot') {
        return [{ from: 'root', addonsActor: 'addonsActor1' }];
      }
      if (last?.type === 'installTemporaryAddon') {
        return [{
          from: 'addonsActor1',
          error: 'addonInstallFailed',
          message: 'Manifest is missing required field: manifest_version',
        }];
      }
      return [];
    });

    try {
      await expect(installFirefoxAddonOverRDP({
        extensionDir,
        port: server.port,
        connectIntervalMs: 25,
        connectTimeoutMs: 2_000,
        requestTimeoutMs: 2_000,
      })).rejects.toThrow(/Manifest is missing required field/);
    } finally {
      await server.close();
    }
  });

  it('fails fast if the extension directory does not exist', async () => {
    const missing = path.join(os.tmpdir(), 'hexajs-missing-extension-' + Date.now());
    await expect(installFirefoxAddonOverRDP({
      extensionDir: missing,
      port: 6000,
      connectTimeoutMs: 100,
      connectIntervalMs: 25,
    })).rejects.toThrow(/Extension output directory does not exist/);
  });
});

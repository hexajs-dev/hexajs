import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs-extra', () => ({
  ensureDir: vi.fn(),
  writeFile: vi.fn(),
}));

import * as fs from 'fs-extra';
import { scaffold } from '../src/bin/programs/new/services/scaffold.service';

describe('scaffold service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes baseline scaffold files', async () => {
    const projectDir = path.resolve('D:/tmp/my-extension');

    const result = await scaffold({
      name: 'my-extension',
      platforms: ['chrome'],
      destRoot: projectDir,
    });

    const writeFileMock = vi.mocked(fs.writeFile);
    const writtenFiles = writeFileMock.mock.calls.map(call => call[0] as string);
    const packageJsonCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'package.json'));
    const hexaConfigCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'hexa-cli.config.json'));
    const packageJson = JSON.parse(packageJsonCall?.[1] as string) as {
      dependencies?: Record<string, string>;
    };
    const hexaConfig = JSON.parse(hexaConfigCall?.[1] as string) as {
      ui?: {
        popup?: {
          mode?: string;
        };
        devtools?: {
          mode?: string;
        };
      };
    };

    expect(result).toBe(projectDir);
    expect(writeFileMock).toHaveBeenCalledTimes(17);
    expect(writtenFiles).toContain(path.join(projectDir, 'package.json'));
    expect(writtenFiles).toContain(path.join(projectDir, 'hexa-cli.config.json'));
    expect(writtenFiles).toContain(path.join(projectDir, 'src/background/main.ts'));
    expect(writtenFiles).toContain(path.join(projectDir, 'src/content/handler.ts'));
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/popup/index.html'));
    expect(hexaConfig.ui?.popup?.mode).toBe('none');
    expect(hexaConfig.ui?.devtools?.mode).toBe('none');
    expect(packageJson.dependencies?.['@hexajs-dev/ui']).toBeUndefined();
    expect(writeFileMock.mock.calls.every(call => call[2] === 'utf8')).toBe(true);
    expect(vi.mocked(fs.ensureDir)).toHaveBeenCalledTimes(17);
  });

  it('adds popup react files when reactPopup is enabled', async () => {
    const projectDir = path.resolve('D:/tmp/react-popup');

    await scaffold({
      name: 'react-popup',
      platforms: ['chrome', 'firefox'],
      reactPopup: true,
      destRoot: projectDir,
    });

    const writeFileMock = vi.mocked(fs.writeFile);
    const writtenFiles = writeFileMock.mock.calls.map(call => call[0] as string);
    const packageJsonCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'package.json'));
    const hexaConfigCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'hexa-cli.config.json'));
    const packageJson = JSON.parse(packageJsonCall?.[1] as string) as {
      dependencies?: Record<string, string>;
    };
    const hexaConfig = JSON.parse(hexaConfigCall?.[1] as string) as {
      ui?: {
        popup?: {
          mode?: string;
        };
        devtools?: {
          mode?: string;
        };
      };
    };

    expect(writeFileMock).toHaveBeenCalledTimes(22);
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/popup/vite.config.ts'));
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/popup/src/main.tsx'));
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/popup/src/App.tsx'));
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/popup/src/style.css'));
    expect(hexaConfig.ui?.popup?.mode).toBe('managed');
    expect(hexaConfig.ui?.devtools?.mode).toBe('none');
    expect(packageJson.dependencies?.['@hexajs-dev/ui']).toBe('latest');
  });

  it('adds devtools fallback when managedDevtools is enabled without react', async () => {
    const projectDir = path.resolve('D:/tmp/devtools-fallback');

    await scaffold({
      name: 'devtools-fallback',
      platforms: ['edge'],
      managedDevtools: true,
      reactDevtools: false,
      destRoot: projectDir,
    });

    const writeFileMock = vi.mocked(fs.writeFile);
    const writtenFiles = writeFileMock.mock.calls.map(call => call[0] as string);
    const packageJsonCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'package.json'));
    const hexaConfigCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'hexa-cli.config.json'));
    const packageJson = JSON.parse(packageJsonCall?.[1] as string) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const hexaConfig = JSON.parse(hexaConfigCall?.[1] as string) as {
      ui?: {
        popup?: {
          mode?: string;
        };
        devtools?: {
          mode?: string;
        };
      };
    };

    expect(writeFileMock).toHaveBeenCalledTimes(18);
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/devtools/index.html'));
    expect(hexaConfig.ui?.popup?.mode).toBe('none');
    expect(hexaConfig.ui?.devtools?.mode).toBe('managed');
    expect(packageJson.dependencies?.['@hexajs-dev/ui']).toBe('latest');
    expect(packageJson.dependencies?.react).toBeUndefined();
    expect(packageJson.devDependencies?.['@vitejs/plugin-react']).toBeUndefined();
  });

  it('adds full react devtools bundle when managed and reactDevtools are enabled', async () => {
    const projectDir = path.resolve('D:/tmp/react-devtools');

    await scaffold({
      name: 'react-devtools',
      platforms: ['chrome'],
      managedDevtools: true,
      reactDevtools: true,
      destRoot: projectDir,
    });

    const writeFileMock = vi.mocked(fs.writeFile);
    const writtenFiles = writeFileMock.mock.calls.map(call => call[0] as string);
    const packageJsonCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'package.json'));
    const hexaConfigCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'hexa-cli.config.json'));
    const packageJson = JSON.parse(packageJsonCall?.[1] as string) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const hexaConfig = JSON.parse(hexaConfigCall?.[1] as string) as {
      ui?: {
        popup?: {
          mode?: string;
        };
        devtools?: {
          mode?: string;
        };
      };
    };

    expect(writeFileMock).toHaveBeenCalledTimes(25);
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/devtools/vite.config.ts'));
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/devtools/devtools.ts'));
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/devtools/devtools.html'));
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/devtools/src/main.tsx'));
    expect(writtenFiles).toContain(path.join(projectDir, 'ui/devtools/src/App.tsx'));
    expect(hexaConfig.ui?.popup?.mode).toBe('none');
    expect(hexaConfig.ui?.devtools?.mode).toBe('managed');
    expect(packageJson.dependencies?.['@hexajs-dev/ui']).toBe('latest');
    expect(packageJson.dependencies?.react).toBeDefined();
    expect(packageJson.devDependencies?.['@vitejs/plugin-react']).toBeDefined();
  });

  it('prioritizes chrome then firefox for defaultPlatform', async () => {
    const projectDir = path.resolve('D:/tmp/default-platform-priority');

    await scaffold({
      name: 'default-platform-priority',
      platforms: ['safari', 'firefox', 'chrome'],
      destRoot: projectDir,
    });

    const writeFileMock = vi.mocked(fs.writeFile);
    const hexaConfigCall = writeFileMock.mock.calls.find(call => call[0] === path.join(projectDir, 'hexa-cli.config.json'));
    const hexaConfig = JSON.parse(hexaConfigCall?.[1] as string) as {
      defaultPlatform?: string;
    };

    expect(hexaConfig.defaultPlatform).toBe('chrome');
  });
});

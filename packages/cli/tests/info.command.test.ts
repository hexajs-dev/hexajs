import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import cliPackage from '../package.json';
import { runCli } from './helpers/command.utils';

const detectProjectPMMock = vi.hoisted(() => vi.fn());
const getPackageManagerVersionMock = vi.hoisted(() => vi.fn());

vi.mock('../src/shared/package-manager', () => ({
  detectProjectPM: detectProjectPMMock,
  getPackageManagerVersion: getPackageManagerVersionMock,
}));

import { infoCommand } from '../src/bin/programs/info';

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

function resolvePlatformName(platform: NodeJS.Platform): string {
  switch (platform) {
    case 'darwin':
      return 'macOS';
    case 'win32':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      return platform;
  }
}

describe('info command', () => {
  const tempDirs: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    detectProjectPMMock.mockReturnValue('npm');
    getPackageManagerVersionMock.mockReturnValue('10.2.4');
  });

  afterEach(() => {
    while (tempDirs.length > 0) {
      const tempDir = tempDirs.pop();
      if (tempDir) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
    vi.restoreAllMocks();
  });

  it('prints system details and all detected local @hexajs-dev packages', async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-info-'));
    tempDirs.push(projectDir);

    writeJson(path.join(projectDir, 'package.json'), {
      name: 'sample',
      version: '1.0.0',
      dependencies: {
        '@hexajs-dev/ui': 'latest',
        '@hexajs-dev/common': 'latest',
        '@hexajs-dev/core': 'latest',
      },
      devDependencies: {
        '@hexajs-dev/cli': 'latest',
      },
    });

    writeJson(path.join(projectDir, 'node_modules', '@hexajs-dev', 'core', 'package.json'), {
      name: '@hexajs-dev/core',
      version: '0.9.3-alpha.0',
    });
    writeJson(path.join(projectDir, 'node_modules', '@hexajs-dev', 'ui', 'package.json'), {
      name: '@hexajs-dev/ui',
      version: '0.9.3-alpha.0',
    });
    writeJson(path.join(projectDir, 'node_modules', '@hexajs-dev', 'common', 'package.json'), {
      name: '@hexajs-dev/common',
      version: '0.9.3-alpha.0',
    });

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    const program = new Command();
    infoCommand(program);

    await runCli(program, ['info']);

    const logs = (console.log as any).mock.calls.map((call: unknown[]) => String(call[0] ?? ''));

    expect(logs).toContain(`System: ${resolvePlatformName(process.platform)} ${os.release()} (${process.arch})`);
    expect(logs).toContain(`Node: ${process.version}`);
    expect(logs).toContain('Package Manager: npm 10.2.4');
    expect(logs).toContain('HexaJS Environment:');
    expect(logs).toContain(`@hexajs-dev/cli: ${cliPackage.version} (global)`);
    expect(logs.filter(line => line.endsWith('(local)'))).toEqual([
      '@hexajs-dev/common: 0.9.3-alpha.0 (local)',
      '@hexajs-dev/core: 0.9.3-alpha.0 (local)',
      '@hexajs-dev/ui: 0.9.3-alpha.0 (local)',
    ]);
    expect(detectProjectPMMock).toHaveBeenCalledWith(projectDir);
  });

  it('prints a fallback line when no local @hexajs-dev packages are declared', async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-info-'));
    tempDirs.push(projectDir);

    writeJson(path.join(projectDir, 'package.json'), {
      name: 'sample',
      version: '1.0.0',
      dependencies: {
        react: '^18.3.1',
      },
    });

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    const program = new Command();
    infoCommand(program);

    await runCli(program, ['info']);

    const logs = (console.log as any).mock.calls.map((call: unknown[]) => String(call[0] ?? ''));
    expect(logs).toContain('No local @hexajs-dev/* packages detected.');
  });

  it('prints unknown for a declared package that cannot be resolved locally', async () => {
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-info-'));
    tempDirs.push(projectDir);

    writeJson(path.join(projectDir, 'package.json'), {
      name: 'sample',
      version: '1.0.0',
      dependencies: {
        '@hexajs-dev/nonexistent': 'latest',
      },
    });

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    const program = new Command();
    infoCommand(program);

    await runCli(program, ['info']);

    const logs = (console.log as any).mock.calls.map((call: unknown[]) => String(call[0] ?? ''));
    expect(logs).toContain('@hexajs-dev/nonexistent: unknown (local)');
  });
});
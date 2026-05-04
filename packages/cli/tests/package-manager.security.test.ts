import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAddDependencyCommand, getInstallCommand, getRunScriptCommand } from '../src/shared/package-manager';

const originalSystemRoot = process.env.SystemRoot;
const originalWindir = process.env.WINDIR;
const tempDirs: string[] = [];

function createWindowsRootFixture(withCmd: boolean): string {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-win-cmd-'));
  tempDirs.push(rootDir);

  const system32Dir = path.join(rootDir, 'System32');
  fs.mkdirSync(system32Dir, { recursive: true });

  if (withCmd) {
    fs.writeFileSync(path.join(system32Dir, 'cmd.exe'), '', 'utf8');
  }

  return rootDir;
}

afterEach(() => {
  vi.restoreAllMocks();
  process.env.SystemRoot = originalSystemRoot;
  process.env.WINDIR = originalWindir;

  for (const tempDir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('package manager security', () => {
  it('uses trusted System32 cmd path on Windows for install commands', () => {
    const windowsRoot = createWindowsRootFixture(true);
    const expectedCmdPath = path.join(windowsRoot, 'System32', 'cmd.exe');

    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    process.env.SystemRoot = windowsRoot;
    process.env.WINDIR = windowsRoot;

    const command = getInstallCommand('npm');

    expect(path.normalize(command.command).toLowerCase()).toBe(path.normalize(expectedCmdPath).toLowerCase());
    expect(command.args).toEqual(['/d', '/s', '/c', 'npm install']);
    expect(command.display).toBe('npm install');
  });

  it('fails fast when trusted cmd path cannot be resolved on Windows', () => {
    const windowsRoot = createWindowsRootFixture(false);

    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    process.env.SystemRoot = windowsRoot;
    process.env.WINDIR = windowsRoot;

    expect(() => getInstallCommand('npm')).toThrow(/trusted Windows cmd\.exe path/i);
  });

  it('rejects runtime package manager values outside the allowlist', () => {
    expect(() => getInstallCommand('evil' as any)).toThrow(/Invalid package manager/i);
    expect(() => getRunScriptCommand('evil' as any, 'build')).toThrow(/Invalid package manager/i);
    expect(() => getAddDependencyCommand('evil' as any, '@hexajs-dev/core')).toThrow(/Invalid package manager/i);
  });
});

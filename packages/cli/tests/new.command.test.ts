import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from './helpers/command.utils';

const promptMock = vi.hoisted(() => vi.fn());
const scaffoldMock = vi.hoisted(() => vi.fn());
const printErrorMock = vi.hoisted(() => vi.fn());
const printSuccessMock = vi.hoisted(() => vi.fn());
const detectAvailablePMsMock = vi.hoisted(() => vi.fn());
const getInstallCommandMock = vi.hoisted(() => vi.fn());
const getPackageManagerVersionMock = vi.hoisted(() => vi.fn());
const getRunScriptCommandMock = vi.hoisted(() => vi.fn());
const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('enquirer', () => ({
  default: { prompt: promptMock },
}));

vi.mock('../src/bin/programs/new/services/scaffold.service', () => ({
  scaffold: scaffoldMock,
}));

vi.mock('../src/bin/shared/reporter', () => ({
  printError: printErrorMock,
  printSuccess: printSuccessMock,
}));

vi.mock('../src/shared/package-manager', () => ({
  ALL_PACKAGE_MANAGERS: ['npm', 'pnpm', 'yarn', 'bun'],
  detectAvailablePMs: detectAvailablePMsMock,
  getInstallCommand: getInstallCommandMock,
  getPackageManagerVersion: getPackageManagerVersionMock,
  getRunScriptCommand: getRunScriptCommandMock,
}));

vi.mock('child_process', () => ({
  spawn: spawnMock,
}));

import { newCommand } from '../src/bin/programs/new/new';

describe('new command', () => {
  const createSpawnResult = (code: number, stderrOutput = '') => {
    return {
      stdout: {
        on(_event: string, _handler: (...args: any[]) => void) {
          return this;
        },
      },
      stderr: {
        on(event: string, handler: (...args: any[]) => void) {
          if (event === 'data' && stderrOutput) {
            handler(stderrOutput);
          }
          return this;
        },
      },
      on(event: string, handler: (...args: any[]) => void) {
        if (event === 'close') handler(code);
        return this;
      },
    };
  };

  const wireSuccessfulInstall = () => {
    spawnMock.mockImplementation(() => createSpawnResult(0));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    scaffoldMock.mockResolvedValue('D:/tmp/my-extension');
    detectAvailablePMsMock.mockReturnValue(['npm', 'pnpm']);
    getInstallCommandMock.mockReturnValue({ command: 'npm', args: ['install'], display: 'npm install' });
    getPackageManagerVersionMock.mockReturnValue('10.9.0');
    getRunScriptCommandMock.mockReturnValue('npm run build');
    wireSuccessfulInstall();
  });

  it('uses explicit --platform list and calls scaffold with parsed platforms', async () => {
    promptMock
      .mockResolvedValueOnce({ template: 'full' })
      .mockResolvedValueOnce({ reactPopup: false })
      .mockResolvedValueOnce({ managedDevtools: false })
      .mockResolvedValueOnce({ packageManager: 'npm' });

    const program = new Command();
    newCommand(program);

    await runCli(program, ['new', 'my-extension', '--platform', 'chrome,firefox']);

    expect(scaffoldMock).toHaveBeenCalledTimes(1);
    expect(scaffoldMock).toHaveBeenCalledWith({
      name: 'my-extension',
      platforms: ['chrome', 'firefox'],
      reactPopup: false,
      managedDevtools: false,
      reactDevtools: false,
      blank: false,
      packageManager: 'npm',
      packageManagerVersion: '10.9.0',
    });
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(spawnMock.mock.calls[0]?.[2]).toMatchObject({ shell: false });
    expect(getRunScriptCommandMock).toHaveBeenCalledWith('npm', 'build:chrome');
    expect(printSuccessMock).toHaveBeenCalledTimes(1);
  });

  it('prompts for platform selection when --platform is omitted', async () => {
    promptMock
      .mockResolvedValueOnce({ template: 'full' })
      .mockResolvedValueOnce({ platforms: ['chrome', 'edge'] })
      .mockResolvedValueOnce({ reactPopup: true })
      .mockResolvedValueOnce({ managedDevtools: true })
      .mockResolvedValueOnce({ packageManager: 'npm' });

    const program = new Command();
    newCommand(program);

    await runCli(program, ['new', 'my-extension']);

    expect(scaffoldMock).toHaveBeenCalledWith({
      name: 'my-extension',
      platforms: ['chrome', 'edge'],
      reactPopup: true,
      managedDevtools: true,
      reactDevtools: true,
      blank: false,
      packageManager: 'npm',
      packageManagerVersion: '10.9.0',
    });
    expect(getRunScriptCommandMock).toHaveBeenCalledWith('npm', 'build:chrome');
  });

  it('uses firefox as default build platform when chrome is not selected', async () => {
    promptMock
      .mockResolvedValueOnce({ template: 'full' })
      .mockResolvedValueOnce({ reactPopup: false })
      .mockResolvedValueOnce({ managedDevtools: false })
      .mockResolvedValueOnce({ packageManager: 'npm' });

    const program = new Command();
    newCommand(program);

    await runCli(program, ['new', 'my-extension', '--platform', 'safari,firefox']);

    expect(getRunScriptCommandMock).toHaveBeenCalledWith('npm', 'build:firefox');
  });

  it('retries npm install with --legacy-peer-deps when npm returns ERESOLVE', async () => {
    promptMock
      .mockResolvedValueOnce({ template: 'full' })
      .mockResolvedValueOnce({ reactPopup: false })
      .mockResolvedValueOnce({ managedDevtools: false })
      .mockResolvedValueOnce({ packageManager: 'npm' });

    spawnMock
      .mockImplementationOnce(() => createSpawnResult(
        1,
        'npm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree\n'
      ))
      .mockImplementationOnce(() => createSpawnResult(0));

    const program = new Command();
    newCommand(program);

    await runCli(program, ['new', 'my-extension', '--platform', 'chrome']);

    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(spawnMock.mock.calls[1]?.[1]).toEqual(['install', '--legacy-peer-deps']);
    expect(printSuccessMock).toHaveBeenCalledTimes(1);
    expect(printErrorMock).not.toHaveBeenCalled();
  });

  it('reports error and exits when --platform contains invalid values', async () => {
    promptMock.mockResolvedValueOnce({ template: 'full' });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    newCommand(program);

    await expect(runCli(program, ['new', 'my-extension', '--platform', 'chrome,invalid'])).rejects.toThrow('process.exit:1');

    expect(printErrorMock).toHaveBeenCalledTimes(1);
    expect(String(printErrorMock.mock.calls[0][0])).toContain('Unknown platform');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('returns silently when prompt is canceled by user', async () => {
    promptMock.mockRejectedValueOnce('');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    newCommand(program);

    await runCli(program, ['new', 'bad name']);

    expect(scaffoldMock).not.toHaveBeenCalled();
    expect(printErrorMock).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

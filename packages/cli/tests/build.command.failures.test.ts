import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from './helpers/command.utils';

const fsMocks = vi.hoisted(() => ({
  pathExists: vi.fn(),
  readJson: vi.fn(),
}));

const configMocks = vi.hoisted(() => ({
  loadHexaConfig: vi.fn(),
  resolveConfig: vi.fn(),
}));

const runtimeMocks = vi.hoisted(() => ({
  buildAction: vi.fn(),
  runWatchMode: vi.fn(),
}));

const reporterMocks = vi.hoisted(() => ({
  printHeader: vi.fn(),
  printSuccess: vi.fn(),
  printError: vi.fn(),
  startStep: vi.fn(),
}));

vi.mock('fs-extra', () => ({
  pathExists: fsMocks.pathExists,
  readJson: fsMocks.readJson,
}));

vi.mock('../src/bin/config/config', () => ({
  loadHexaConfig: configMocks.loadHexaConfig,
}));

vi.mock('../src/bin/config/resolve', () => ({
  resolveConfig: configMocks.resolveConfig,
}));

vi.mock('../src/index', () => ({
  buildAction: runtimeMocks.buildAction,
}));

vi.mock('../src/hmr/watch-runner', () => ({
  runWatchMode: runtimeMocks.runWatchMode,
}));

vi.mock('../src/bin/shared/reporter', () => ({
  printHeader: reporterMocks.printHeader,
  printSuccess: reporterMocks.printSuccess,
  printError: reporterMocks.printError,
  startStep: reporterMocks.startStep,
}));

import { build } from '../src/bin/programs/build';

describe('build command failure paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    fsMocks.pathExists.mockResolvedValue(true);
    fsMocks.readJson.mockResolvedValue({});

    configMocks.loadHexaConfig.mockResolvedValue({
      project: { name: 'sample-project' },
      defaultPlatform: 'chrome',
      defaultMode: 'development',
    });

    configMocks.resolveConfig.mockReturnValue({
      tsConfig: 'tsconfig.json',
      manifest: 'manifest.chrome.json',
      outDir: 'dist/chrome/development',
      compilerOptions: {
        tsConfig: 'tsconfig.json',
        assets: [],
        minify: false,
        cssMinify: false,
        sourceMap: true,
        terserOptions: {},
      },
      tokens: [],
      platform: 'chrome',
      mode: 'development',
      project: {
        name: 'sample-project',
        sourceRoot: 'src',
      },
      ui: {
        popup: { mode: 'managed', sourceDir: 'ui/popup' },
      },
    });

    reporterMocks.startStep.mockImplementation(() => vi.fn());
    runtimeMocks.buildAction.mockResolvedValue({ contentBootstraps: [] });
    runtimeMocks.runWatchMode.mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('exits when current directory is not a HexaJS project', async () => {
    fsMocks.pathExists.mockResolvedValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    build(program);

    await expect(runCli(program, ['build'])).rejects.toThrow('process.exit:1');

    expect(reporterMocks.printError).toHaveBeenCalledWith('The current directory is not a HexaJS extension project.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when Hexa config file exists but contains invalid JSON', async () => {
    fsMocks.pathExists.mockResolvedValueOnce(true);
    fsMocks.readJson.mockRejectedValueOnce(new Error('invalid json'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    build(program);

    await expect(runCli(program, ['build'])).rejects.toThrow('process.exit:1');

    expect(reporterMocks.printError).toHaveBeenCalledWith('Invalid Hexa config file: hexa-cli.config.json.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when build target option is invalid', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    build(program);

    await expect(runCli(program, ['build', '--target', 'invalid-target'])).rejects.toThrow('process.exit:1');

    expect(reporterMocks.printError).toHaveBeenCalledWith(expect.stringContaining('Invalid build target "invalid-target"'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when watch mode is used with non-all target', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    build(program);

    await expect(runCli(program, ['build', '--watch', '--target', 'ui'])).rejects.toThrow('process.exit:1');

    expect(reporterMocks.printError).toHaveBeenCalledWith('Watch mode only supports full builds. Remove --target when using --watch.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits when watch mode is requested without managed UI surfaces', async () => {
    configMocks.resolveConfig.mockReturnValue({
      tsConfig: 'tsconfig.json',
      manifest: 'manifest.chrome.json',
      outDir: 'dist/chrome/development',
      compilerOptions: {
        tsConfig: 'tsconfig.json',
        assets: [],
        minify: false,
        cssMinify: false,
        sourceMap: true,
        terserOptions: {},
      },
      tokens: [],
      platform: 'chrome',
      mode: 'development',
      project: {
        name: 'sample-project',
        sourceRoot: 'src',
      },
      ui: {
        popup: { mode: 'external', distDir: 'ui/dist', indexFile: 'index.html' },
        devtools: { mode: 'none' },
      },
    });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit:${code}`);
    }) as never);

    const program = new Command();
    build(program);

    await expect(runCli(program, ['build', '--watch'])).rejects.toThrow('process.exit:1');

    expect(reporterMocks.printError).toHaveBeenCalledWith('Watch mode currently supports managed UI only. Configure popup/devtools mode as "managed" or run without --watch.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

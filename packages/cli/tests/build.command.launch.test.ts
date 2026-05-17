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

const launcherMocks = vi.hoisted(() => ({
  launchChromeWithExtension: vi.fn(),
}));

const reporterMocks = vi.hoisted(() => ({
  printHeader: vi.fn(),
  printSuccess: vi.fn(),
  printError: vi.fn(),
  startStep: vi.fn(),
}));

const loggingMocks = vi.hoisted(() => ({
  printInfoLine: vi.fn(),
  printWarningLine: vi.fn(),
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

vi.mock('../src/shared/chrome-launcher', () => ({
  launchChromeWithExtension: launcherMocks.launchChromeWithExtension,
}));

vi.mock('../src/shared/logging', () => ({
  printInfoLine: loggingMocks.printInfoLine,
  printWarningLine: loggingMocks.printWarningLine,
}));

vi.mock('../src/bin/shared/reporter', () => ({
  printHeader: reporterMocks.printHeader,
  printSuccess: reporterMocks.printSuccess,
  printError: reporterMocks.printError,
  startStep: reporterMocks.startStep,
}));

import { build } from '../src/bin/programs/build';

describe('build command chrome watch auto-launch', () => {
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
    runtimeMocks.runWatchMode.mockImplementation(async (options: any) => {
      await options.onInitialBuild('http://localhost:5173', 'watch-token');
    });

    launcherMocks.launchChromeWithExtension.mockReturnValue({
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      executableKind: 'chromium-like',
      extensionDir: 'D:/GitHub/hexajs/examples/smart-clipper/dist/chrome/development',
      extensionId: 'nhhligopnhmgjjlbkbokcoldodmnmpji',
      userDataDir: 'C:/Users/test/AppData/Local/Temp/hexajs/chrome-dev-profile/abcd1234',
      debugPort: 9222,
      args: [],
    });
  });

  it('launches Chrome in watch mode for chrome platform by default', async () => {
    const program = new Command();
    build(program);

    await runCli(program, ['build', '--watch']);

    expect(runtimeMocks.runWatchMode).toHaveBeenCalledTimes(1);
    expect(runtimeMocks.buildAction).toHaveBeenCalledTimes(1);
    expect(launcherMocks.launchChromeWithExtension).toHaveBeenCalledTimes(1);
  });

  it('does not launch Chrome when auto-open is disabled', async () => {
    const program = new Command();
    build(program);

    await runCli(program, ['build', '--watch', '--no-auto-open-browser']);

    expect(runtimeMocks.runWatchMode).toHaveBeenCalledTimes(1);
    expect(launcherMocks.launchChromeWithExtension).not.toHaveBeenCalled();
  });

  it('does not launch Chrome for non-chrome platforms', async () => {
    configMocks.resolveConfig.mockReturnValue({
      tsConfig: 'tsconfig.json',
      manifest: 'manifest.firefox.json',
      outDir: 'dist/firefox/development',
      compilerOptions: {
        tsConfig: 'tsconfig.json',
        assets: [],
        minify: false,
        cssMinify: false,
        sourceMap: true,
        terserOptions: {},
      },
      tokens: [],
      platform: 'firefox',
      mode: 'development',
      project: {
        name: 'sample-project',
        sourceRoot: 'src',
      },
      ui: {
        popup: { mode: 'managed', sourceDir: 'ui/popup' },
      },
    });

    const program = new Command();
    build(program);

    await runCli(program, ['build', '--watch', '--platform', 'firefox']);

    expect(runtimeMocks.runWatchMode).toHaveBeenCalledTimes(1);
    expect(launcherMocks.launchChromeWithExtension).not.toHaveBeenCalled();
  });

  it('does not launch Chrome outside watch mode', async () => {
    const program = new Command();
    build(program);

    await runCli(program, ['build']);

    expect(runtimeMocks.runWatchMode).not.toHaveBeenCalled();
    expect(launcherMocks.launchChromeWithExtension).not.toHaveBeenCalled();
  });

  it('keeps watch mode running when Chrome launch fails', async () => {
    launcherMocks.launchChromeWithExtension.mockImplementation(() => {
      throw new Error('Chrome executable missing');
    });

    const program = new Command();
    build(program);

    await expect(runCli(program, ['build', '--watch'])).resolves.toBeUndefined();

    expect(runtimeMocks.runWatchMode).toHaveBeenCalledTimes(1);
    expect(loggingMocks.printWarningLine).toHaveBeenCalledWith(expect.stringContaining('Chrome auto-launch skipped'));
  });
});
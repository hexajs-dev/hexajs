import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createRequire } from 'module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResolvedBuildConfig } from '../src/bin/config/resolve';
import { buildUiEntries } from '../src/build/ui.builder';

interface FakeUiState {
  popupStart: number;
  popupEnd: number;
  devtoolsStart: number;
  devtoolsEnd: number;
}

function createResolvedConfig(parallelBuild: boolean): ResolvedBuildConfig {
  return {
    tsConfig: 'tsconfig.json',
    manifest: '',
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
      name: 'UI Parallel Test',
      version: '1.0.0',
      sourceRoot: 'src',
    },
    ui: {
      parallelBuild,
      popup: { mode: 'managed' },
      devtools: { mode: 'managed' },
    },
  };
}

function writeFakeHexaUiModule(projectDir: string, delayMs: number = 80): void {
  const moduleDir = path.join(projectDir, 'node_modules', '@hexajs-dev', 'ui');
  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(path.join(moduleDir, 'index.js'), [
    'const state = { popupStart: 0, popupEnd: 0, devtoolsStart: 0, devtoolsEnd: 0 };',
    'function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }',
    'module.exports = {',
    '  __getState: () => state,',
    '  buildManagedPopup: async () => {',
    '    state.popupStart = Date.now();',
    `    await sleep(${delayMs});`,
    '    state.popupEnd = Date.now();',
    "    return 'ui/popup/index.html';",
    '  },',
    '  buildManagedDevtools: async () => {',
    '    state.devtoolsStart = Date.now();',
    `    await sleep(${delayMs});`,
    '    state.devtoolsEnd = Date.now();',
    "    return 'ui/devtools/devtools.html';",
    '  },',
    '};',
    '',
  ].join('\n'), 'utf-8');
}

function createProject(tempRoot: string): string {
  const projectDir = fs.mkdtempSync(path.join(tempRoot, 'ui-parallel-project-'));
  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({ name: 'ui-parallel-project', version: '1.0.0' }, null, 2), 'utf-8');
  return projectDir;
}

function getFakeUiState(projectDir: string): FakeUiState {
  const projectRequire = createRequire(path.join(projectDir, 'package.json'));
  const uiModule = projectRequire('@hexajs-dev/ui') as { __getState: () => FakeUiState };
  return uiModule.__getState();
}

function expectParallelOverlap(state: FakeUiState): void {
  const overlapStart = Math.max(state.popupStart, state.devtoolsStart);
  const overlapEnd = Math.min(state.popupEnd, state.devtoolsEnd);
  expect(overlapEnd).toBeGreaterThan(overlapStart);
}

function expectSequentialPopupThenDevtools(state: FakeUiState): void {
  expect(state.popupStart).toBeGreaterThan(0);
  expect(state.popupEnd).toBeGreaterThanOrEqual(state.popupStart);
  expect(state.devtoolsStart).toBeGreaterThanOrEqual(state.popupEnd);
  expect(state.devtoolsEnd).toBeGreaterThanOrEqual(state.devtoolsStart);
}

describe('buildUiEntries managed ui parallelization', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-ui-parallel-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('builds managed popup and devtools in parallel when ui.parallelBuild is enabled', async () => {
    const projectDir = createProject(tempRoot);
    writeFakeHexaUiModule(projectDir);

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    const resolved = createResolvedConfig(true);
    const outputDir = path.join(projectDir, resolved.outDir);
    fs.mkdirSync(outputDir, { recursive: true });

    const entries = await buildUiEntries(resolved, outputDir, path.join(outputDir, 'ui', 'ui.bootstrap.js'), false);

    expect(entries).toEqual({
      popup: 'ui/popup/index.html',
      devtools: 'ui/devtools/devtools.html',
    });

    const state = getFakeUiState(projectDir);
    expectParallelOverlap(state);
  });

  it('falls back to sequential managed builds when ui.parallelBuild is disabled', async () => {
    const projectDir = createProject(tempRoot);
    writeFakeHexaUiModule(projectDir);

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    const resolved = createResolvedConfig(false);
    const outputDir = path.join(projectDir, resolved.outDir);
    fs.mkdirSync(outputDir, { recursive: true });

    await buildUiEntries(resolved, outputDir, path.join(outputDir, 'ui', 'ui.bootstrap.js'), false);

    const state = getFakeUiState(projectDir);
    expectSequentialPopupThenDevtools(state);
  });

  it('keeps managed builds sequential in watch mode', async () => {
    const projectDir = createProject(tempRoot);
    writeFakeHexaUiModule(projectDir);

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    const resolved = createResolvedConfig(true);
    const outputDir = path.join(projectDir, resolved.outDir);
    fs.mkdirSync(outputDir, { recursive: true });

    await buildUiEntries(resolved, outputDir, path.join(outputDir, 'ui', 'ui.bootstrap.js'), true);

    const state = getFakeUiState(projectDir);
    expectSequentialPopupThenDevtools(state);
  });
});

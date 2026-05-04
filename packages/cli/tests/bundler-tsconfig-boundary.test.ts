import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const buildMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('vite', () => ({
  build: buildMock,
}));

import { bundleBootstrapFiles } from '../src/bundler';

const tempDirs: string[] = [];

function createTempBuildRoot(): { rootDir: string; outputDir: string; entryFile: string } {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-bundler-boundary-'));
  tempDirs.push(rootDir);

  const outputDir = path.join(rootDir, 'dist');
  const entryFile = path.join(outputDir, 'background', 'bootstrap.js');

  fs.mkdirSync(path.dirname(entryFile), { recursive: true });
  fs.writeFileSync(entryFile, 'console.log("bootstrap");', 'utf8');
  fs.writeFileSync(path.join(rootDir, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }), 'utf8');

  return { rootDir, outputDir, entryFile };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

beforeEach(() => {
  buildMock.mockClear();
});

describe('bundler tsConfig boundary', () => {
  it('rejects tsConfigPath values that escape the project root', async () => {
    const { rootDir, outputDir, entryFile } = createTempBuildRoot();

    await expect(bundleBootstrapFiles({
      outputDir,
      entryPoints: [entryFile],
      minify: false,
      sourceMap: false,
      cssMinify: false,
      terserOptions: {},
      projectRoot: rootDir,
      platform: 'chrome',
      context: 'background',
      tsConfigPath: '../outside.tsconfig.json',
    })).rejects.toThrow(/tsconfig path must stay within the project root/i);

    expect(buildMock).not.toHaveBeenCalled();
  });

  it('allows in-root tsConfigPath values and proceeds to build', async () => {
    const { rootDir, outputDir, entryFile } = createTempBuildRoot();

    await bundleBootstrapFiles({
      outputDir,
      entryPoints: [entryFile],
      minify: false,
      sourceMap: false,
      cssMinify: false,
      terserOptions: {},
      projectRoot: rootDir,
      platform: 'chrome',
      context: 'background',
      tsConfigPath: 'tsconfig.json',
    });

    expect(buildMock).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ResolvedBuildConfig } from '../src/bin/config/resolve';
import { copyStaticAssets } from '../src/generators/assets/generator';

function createResolved(assets: string[]): ResolvedBuildConfig {
  return {
    tsConfig: 'tsconfig.json',
    manifest: '',
    outDir: 'dist/chrome/development',
    compilerOptions: {
      tsConfig: 'tsconfig.json',
      assets,
      minify: false,
      cssMinify: false,
      sourceMap: true,
      terserOptions: {},
    },
    tokens: [],
    platform: 'chrome',
    mode: 'development',
    project: {
      name: 'Security Test App',
      version: '1.0.0',
      sourceRoot: 'src',
    },
    ui: {},
  };
}

describe('copyStaticAssets security', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-assets-security-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('copies assets that stay within the project root', async () => {
    const projectDir = path.join(tempRoot, 'project');
    const outputDir = path.join(projectDir, 'dist', 'chrome', 'development');
    fs.mkdirSync(path.join(projectDir, 'src', 'images'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'src', 'images', 'icon.txt'), 'icon', 'utf-8');

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    await copyStaticAssets(createResolved(['src/images/icon.txt']), outputDir);

    expect(fs.readFileSync(path.join(outputDir, 'images', 'icon.txt'), 'utf-8')).toBe('icon');
  });

  it('rejects asset patterns that resolve outside the project root', async () => {
    const workspaceDir = path.join(tempRoot, 'workspace');
    const projectDir = path.join(workspaceDir, 'project');
    const outputDir = path.join(projectDir, 'dist', 'chrome', 'development');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(workspaceDir, 'secret.txt'), 'secret', 'utf-8');

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    await expect(copyStaticAssets(createResolved(['../secret.txt']), outputDir)).rejects.toThrow(/outside the project root/i);
    expect(fs.existsSync(path.join(workspaceDir, 'project', 'dist', 'chrome', 'secret.txt'))).toBe(false);
  });
});
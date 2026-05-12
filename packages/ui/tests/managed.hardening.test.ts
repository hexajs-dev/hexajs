import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { HexaUiCompilerOptions } from '../src/core/types';
import { getDefaultViteConfig, loadUserViteConfig, mergeViteConfigs } from '../src/core/config';
import { buildManagedPopup } from '../src/popup/managed';
import { buildManagedDevtools } from '../src/devtools/managed';

describe('managed ui hardening', () => {
  let tempRoot: string;
  let outputDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  const compilerOptions: HexaUiCompilerOptions = {
    minify: false,
    cssMinify: false,
    sourceMap: false,
    terserOptions: {},
  };

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-ui-managed-'));
    outputDir = path.join(tempRoot, 'extension-dist');
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('rejects managed popup sourceDir values that escape project root', async () => {
    await expect(
      buildManagedPopup(
        { mode: 'managed', sourceDir: '../outside', indexFile: 'index.html' },
        outputDir,
        compilerOptions,
        path.join(tempRoot, 'ui.bootstrap.js'),
        'chrome'
      )
    ).rejects.toThrow('sourceDir must stay inside project root');
  });

  it('rejects managed devtools sourceDir values that escape project root', async () => {
    await expect(
      buildManagedDevtools(
        { mode: 'managed', sourceDir: '../outside', indexFile: 'index.html' },
        outputDir,
        compilerOptions,
        path.join(tempRoot, 'ui.bootstrap.js'),
        'chrome'
      )
    ).rejects.toThrow('sourceDir must stay inside project root');
  });

  it('rejects managed popup indexFile traversal outside sourceDir', async () => {
    const popupDir = path.join(tempRoot, 'ui', 'popup');
    fs.mkdirSync(popupDir, { recursive: true });
    fs.writeFileSync(path.join(popupDir, 'index.html'), '<html>ok</html>', 'utf-8');
    fs.writeFileSync(path.join(tempRoot, 'outside.html'), '<html>outside</html>', 'utf-8');

    await expect(
      buildManagedPopup(
        { mode: 'managed', sourceDir: 'ui/popup', indexFile: '../outside.html' },
        outputDir,
        compilerOptions,
        path.join(tempRoot, 'ui.bootstrap.js'),
        'chrome'
      )
    ).rejects.toThrow('indexFile must stay inside sourceDir');
  });
});

describe('vite config hardening', () => {
  const compilerOptions: HexaUiCompilerOptions = {
    minify: false,
    cssMinify: false,
    sourceMap: false,
    terserOptions: {},
  };

  it('preserves managed root, output directory, and rollup input fields', () => {
    const defaultConfig = getDefaultViteConfig(
      'ui/popup',
      'dist/chrome/production/ui/popup',
      compilerOptions,
      { popup: 'ui/popup/index.html' },
      [],
      {}
    );

    const merged = mergeViteConfigs(defaultConfig, {
      root: '../escape-root',
      build: {
        outDir: '../escape-dist',
        emptyOutDir: false,
        rollupOptions: {
          input: { hacked: 'hacked.html' },
          output: { entryFileNames: 'hacked-[name].js' },
          external: ['custom-lib'],
        },
      },
    });

    expect(merged.root).toBe('ui/popup');
    expect(merged.build.outDir).toBe('dist/chrome/production/ui/popup');
    expect(merged.build.emptyOutDir).toBe(true);
    expect(merged.build.rollupOptions.input).toEqual({ popup: 'ui/popup/index.html' });
    expect(merged.build.rollupOptions.output).toBeUndefined();
    expect(merged.build.rollupOptions.external).toEqual(['custom-lib']);
  });

  it('skips loading user vite config outside project root', async () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-ui-workspace-'));
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-ui-outside-'));
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceRoot);

    try {
      fs.writeFileSync(path.join(outsideDir, 'vite.config.ts'), 'export default {};', 'utf-8');
      await expect(loadUserViteConfig(outsideDir, 'production')).resolves.toBeNull();
    } finally {
      cwdSpy.mockRestore();
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  });
});
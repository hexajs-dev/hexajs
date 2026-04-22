import { describe, expect, it } from 'vitest';
import * as path from 'path';
import { isWatchableUiFile, resolveManagedUiWatchTargets } from '../src/hmr/ui-watch';
import { analyzeChangedFile } from '../src/hmr/rebuild-decision';
import { ResolvedBuildConfig } from '../src/bin/config/resolve';
import { BuildContextMapRecord } from '../src/build/types';

function createResolved(ui: ResolvedBuildConfig['ui']): ResolvedBuildConfig {
  return {
    tsConfig: 'tsconfig.json',
    manifest: '',
    outDir: 'dist/chrome/development',
    compilerOptions: {
      tsConfig: 'tsconfig.json',
      assets: [],
      minify: false,
    },
    tokens: [],
    platform: 'chrome',
    mode: 'development',
    project: {
      name: 'Test Extension',
      version: '1.0.0',
      sourceRoot: 'src',
    },
    ui,
  };
}

describe('ui watch helpers', () => {
  it('resolves popup and devtools managed targets with defaults', () => {
    const targets = resolveManagedUiWatchTargets(createResolved({
      popup: { mode: 'managed' },
      devtools: { mode: 'managed' },
    }), 'D:/repo');

    expect(targets).toEqual([
      { surface: 'popup', sourceDir: path.resolve('D:/repo', 'ui', 'popup') },
      { surface: 'devtools', sourceDir: path.resolve('D:/repo', 'ui', 'devtools') },
    ]);
  });

  it('ignores non-managed surfaces', () => {
    const targets = resolveManagedUiWatchTargets(createResolved({
      popup: { mode: 'external', distDir: 'dist/ui/popup', indexFile: 'index.html' },
      devtools: { mode: 'none' },
    }), 'D:/repo');

    expect(targets).toEqual([]);
  });

  it('detects watchable ui file extensions', () => {
    expect(isWatchableUiFile('D:/repo/ui/popup/src/main.tsx')).toBe(true);
    expect(isWatchableUiFile('D:/repo/ui/popup/index.html')).toBe(true);
    expect(isWatchableUiFile('D:/repo/ui/popup/assets/logo.svg')).toBe(false);
  });
});

describe('rebuild-decision integration', () => {
  it('determines ui context for changed files', () => {
    const map: BuildContextMapRecord = {
      'ui/popup/src/main.tsx': { ui: true },
      'src/services/logger.ts': { background: true, content: true, ui: true },
    };

    expect(analyzeChangedFile('ui/popup/src/main.tsx', map)).toEqual(['ui']);
  });

  it('determines multiple contexts for shared services', () => {
    const map: BuildContextMapRecord = {
      'src/services/shared.ts': { background: true, content: true },
      'src/store/global.state.ts': { background: true, content: true, ui: true },
    };

    expect(analyzeChangedFile('src/services/shared.ts', map)).toEqual(['background', 'content']);
    expect(analyzeChangedFile('src/store/global.state.ts', map)).toEqual(['background', 'content', 'ui']);
  });

  it('returns empty array for unmapped files (fallback to decorator analysis)', () => {
    const map: BuildContextMapRecord = {
      'src/services/logger.ts': { ui: true },
    };

    // File not in map - should default to ui-only rebuild in watch-runner
    expect(analyzeChangedFile('src/new-service.ts', map)).toEqual([]);
  });
});

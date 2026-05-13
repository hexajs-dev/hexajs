import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ManifestGenerator } from '../src/generators/manifest/generator';
import { ResolvedBuildConfig } from '../src/bin/config/resolve';
import { ContentScriptOutput } from '../src/generators/content/generator';
import { ContentRunAt } from '../src/compiler/content/types';

function createResolved(platform: string, manifestPath: string): ResolvedBuildConfig {
  return {
    tsConfig: 'tsconfig.json',
    manifest: manifestPath,
    outDir: `dist/${platform}/development`,
    compilerOptions: {
      tsConfig: 'tsconfig.json',
      assets: [],
      minify: false,
      cssMinify: false,
      sourceMap: true,
      terserOptions: {},
    },
    tokens: [],
    platform,
    mode: 'development',
    project: {
      name: 'Test Extension',
      version: '1.0.0',
      sourceRoot: 'src',
    },
    ui: {},
  };
}

describe('manifest merge', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-manifest-merge-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('preserves external content scripts from user manifest entries', () => {
    const projectDir = path.join(tempRoot, 'project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'manifest.chrome.json'), JSON.stringify({
      content_scripts: [
        {
          js: ['external_content.js'],
          matches: ['https://example.com/*'],
          run_at: 'document_start',
        },
      ],
      permissions: ['storage', 'tabs', 'activeTab'],
    }), 'utf-8');

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    const contentBootstraps: ContentScriptOutput[] = [{
      name: 'main',
      matches: ['<all_urls>'],
      runAt: ContentRunAt.DocumentIdle,
      allFrames: false,
      content: '',
      contentEntries: [],
    }];
    const manifest = JSON.parse(new ManifestGenerator(contentBootstraps, createResolved('chrome', 'manifest.chrome.json')).generate()) as any;

    expect(manifest.content_scripts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        js: ['content/main.js'],
        matches: ['<all_urls>'],
        run_at: 'document_idle',
        all_frames: false,
      }),
      expect.objectContaining({
        js: ['external_content.js'],
        matches: ['https://example.com/*'],
        run_at: 'document_start',
      }),
    ]));
    expect(manifest.permissions).toEqual(expect.arrayContaining(['storage', 'tabs', 'activeTab']));
  });

  it('adds generated content source maps to chromium web accessible resources', () => {
    const projectDir = path.join(tempRoot, 'project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'manifest.chrome.json'), JSON.stringify({
      web_accessible_resources: [
        {
          resources: ['assets/*'],
          matches: ['<all_urls>'],
        },
      ],
    }), 'utf-8');

    vi.spyOn(process, 'cwd').mockReturnValue(projectDir);

    const contentBootstraps: ContentScriptOutput[] = [{
      name: 'main',
      matches: ['https://example.com/*'],
      runAt: ContentRunAt.DocumentIdle,
      allFrames: false,
      content: '',
      contentEntries: [],
    }];
    const manifest = JSON.parse(new ManifestGenerator(contentBootstraps, createResolved('chrome', 'manifest.chrome.json')).generate()) as any;

    expect(manifest.web_accessible_resources).toEqual(expect.arrayContaining([
      expect.objectContaining({
        resources: ['assets/*'],
        matches: ['<all_urls>'],
      }),
      expect.objectContaining({
        resources: ['content/main.js.map'],
        matches: ['https://example.com/*'],
      }),
    ]));
  });
});

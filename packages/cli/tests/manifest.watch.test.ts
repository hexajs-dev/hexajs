import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { ManifestGenerator } from '../src/generators/manifest/generator';
import { ResolvedBuildConfig } from '../src/bin/config/resolve';
import { ContentRunAt } from '../src/compiler/content/types';
import { ContentScriptOutput } from '../src/generators/content/generator';

function createResolved(platform: string): ResolvedBuildConfig {
  return {
    tsConfig: 'tsconfig.json',
    manifest: '',
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
    ui: {
      popup: { mode: 'managed' },
    },
  };
}

describe('manifest watch mode mutations', () => {
  it('adds content matches to host_permissions for watch-mode HMR reinjection', () => {
    const contentBootstraps: ContentScriptOutput[] = [{
      name: 'content-example',
      content: '',
      matches: ['<all_urls>', '*://*.google.com/*'],
      runAt: ContentRunAt.DocumentIdle,
      allFrames: false,
      contentEntries: [],
    }];
    const generator = new ManifestGenerator(contentBootstraps, createResolved('chrome'), {}, {
      watch: true,
      hmrAddress: 'ws://127.0.0.1:55333',
    });

    const manifest = JSON.parse(generator.generate()) as any;

    expect(manifest.permissions).toContain('scripting');
    expect(manifest.host_permissions).toContain('<all_urls>');
    expect(manifest.host_permissions).toContain('*://*.google.com/*');
  });

  it('keeps manifest output readable when minify is enabled', () => {
    const resolved = createResolved('chrome');
    resolved.compilerOptions.minify = 'esbuild';

    const generator = new ManifestGenerator([], resolved);
    const output = generator.generate();

    expect(output).toContain('\n');
    expect(output).toContain('\n  "manifest_version": 3');
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('patches firefox extension_pages script-src with localhost patch origin in watch mode', () => {
    const generator = new ManifestGenerator([], createResolved('firefox'), {}, {
      watch: true,
      hmrAddress: 'ws://127.0.0.1:55333',
    });

    const manifest = JSON.parse(generator.generate()) as any;
    const csp = manifest.content_security_policy?.extension_pages as string;

    expect(csp).toContain("script-src");
    expect(csp).toContain("'self'");
    expect(csp).toContain('http://localhost:5173');
  });

  it('patches safari extension_pages connect-src with hmr address in watch mode', () => {
    const generator = new ManifestGenerator([], createResolved('safari'), {}, {
      watch: true,
      hmrAddress: 'ws://127.0.0.1:55333',
    });

    const manifest = JSON.parse(generator.generate()) as any;
    const csp = manifest.content_security_policy?.extension_pages as string;

    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).toContain('connect-src');
    expect(csp).toContain('ws://127.0.0.1:55333');
  });

  it('includes wasm-compatible extension_pages csp by default for safari manifests', () => {
    const generator = new ManifestGenerator([], createResolved('safari'));
    const manifest = JSON.parse(generator.generate()) as any;

    expect(manifest.content_security_policy?.extension_pages).toContain("script-src 'self'");
    expect(manifest.content_security_policy?.extension_pages).toContain("'wasm-unsafe-eval'");
  });

  it('preserves safari default extension_pages csp when user manifest sets only sandbox policy', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-manifest-'));

    try {
      const manifestPath = path.join(tempDir, 'manifest.safari.json');
      fs.writeFileSync(manifestPath, JSON.stringify({
        content_security_policy: {
          sandbox: "sandbox allow-scripts allow-forms allow-popups allow-modals;",
        },
      }, null, 2));

      const resolved = createResolved('safari');
      resolved.manifest = manifestPath;

      const generator = new ManifestGenerator([], resolved);
      const manifest = JSON.parse(generator.generate()) as any;

      expect(manifest.content_security_policy?.extension_pages).toContain("'wasm-unsafe-eval'");
      expect(manifest.content_security_policy?.sandbox).toContain('sandbox allow-scripts');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('uses background.scripts for safari manifests', () => {
    const generator = new ManifestGenerator([], createResolved('safari'));
    const manifest = JSON.parse(generator.generate()) as any;

    expect(manifest.background?.scripts).toEqual(['background/background.bootstrap.js']);
    expect(manifest.background?.service_worker).toBeUndefined();
  });

  it('rejects safari hmr addresses that are not loopback websocket origins', () => {
    const generator = new ManifestGenerator([], createResolved('safari'), {}, {
      watch: true,
      hmrAddress: 'ws://0.0.0.0:55333/live',
    });

    expect(() => generator.generate()).toThrow(/loopback/i);
  });

  it('does not patch non-safari csp in watch mode', () => {
    const generator = new ManifestGenerator([], createResolved('chrome'), {}, {
      watch: true,
      hmrAddress: 'ws://127.0.0.1:55333',
    });

    const manifest = JSON.parse(generator.generate()) as any;
    const csp = manifest.content_security_policy?.extension_pages as string | undefined;

    expect(csp ?? '').not.toContain('ws://127.0.0.1:55333');
  });

  it('does not infer clipboard permissions when no used ports are provided', () => {
    const manifest = JSON.parse(new ManifestGenerator([], createResolved('safari')).generate()) as any;

    expect(manifest.permissions || []).not.toContain('clipboardRead');
    expect(manifest.permissions || []).not.toContain('clipboardWrite');
  });

  it('infers clipboardRead and clipboardWrite permissions from used ClipboardPort', () => {
    const manifest = JSON.parse(new ManifestGenerator([], createResolved('safari'), {}, {
      usedPorts: ['ClipboardPort'],
    }).generate()) as any;

    expect(manifest.permissions).toContain('clipboardRead');
    expect(manifest.permissions).toContain('clipboardWrite');
  });
});

import { describe, expect, it } from 'vitest';
import { ManifestGenerator } from '../src/generators/manifest/generator';
import { ResolvedBuildConfig } from '../src/bin/config/resolve';
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
      matches: ['<all_urls>', '*://*.google.com/*'],
      runAt: 'document_idle',
      allFrames: false,
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

    expect(csp).toContain('connect-src');
    expect(csp).toContain('ws://127.0.0.1:55333');
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
});

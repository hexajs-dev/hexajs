import { describe, expect, it } from 'vitest';
import { ManifestGenerator } from '../src/generators/manifest/generator';
import { ResolvedBuildConfig } from '../src/bin/config/resolve';

function createResolved(platform: string): ResolvedBuildConfig {
  return {
    tsConfig: 'tsconfig.json',
    manifest: '',
    outDir: `dist/${platform}/development`,
    compilerOptions: {
      tsConfig: 'tsconfig.json',
      assets: [],
      minify: false,
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

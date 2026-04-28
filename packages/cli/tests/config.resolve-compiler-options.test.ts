import { describe, expect, it } from 'vitest';
import { HexaConfig } from '../src/bin/config/config';
import { resolveConfig } from '../src/bin/config/resolve';

function createConfig(overrides: Partial<HexaConfig> = {}): HexaConfig {
  return {
    $schema: './node_modules/@hexajs-dev/cli/schema/hexa-cli.schema.json',
    project: {
      name: 'fixture',
      version: '1.0.0',
      sourceRoot: 'src',
    },
    compilerOptions: {
      tsConfig: 'tsconfig.json',
      assets: [],
      minify: false,
      cssMinify: false,
      sourceMap: true,
      terserOptions: {},
    },
    tokens: [],
    ui: {
      parallelBuild: true,
    },
    environments: {
      production: {
        compilerOptions: {
          minify: true,
          cssMinify: true,
          sourceMap: false,
        },
        platforms: {
          chrome: {
            outDir: 'dist/chrome',
            manifest: 'manifest.chrome.json',
          },
        },
      },
    },
    defaultMode: 'production',
    defaultPlatform: 'chrome',
    ...overrides,
  };
}

describe('resolveConfig compiler options', () => {
  it('normalizes boolean minify=true to esbuild strategy', () => {
    const resolved = resolveConfig(createConfig(), 'chrome', 'production');

    expect(resolved.compilerOptions.minify).toBe('esbuild');
    expect(resolved.compilerOptions.cssMinify).toBe(true);
    expect(resolved.compilerOptions.sourceMap).toBe(false);
  });

  it('preserves terser strategy and terser options', () => {
    const config = createConfig({
      environments: {
        production: {
          compilerOptions: {
            minify: 'terser',
            cssMinify: 'lightningcss',
            sourceMap: 'hidden',
            terserOptions: {
              compress: { drop_console: true },
            },
          },
          platforms: {
            chrome: {
              outDir: 'dist/chrome',
              manifest: 'manifest.chrome.json',
            },
          },
        },
      },
    });

    const resolved = resolveConfig(config, 'chrome', 'production');

    expect(resolved.compilerOptions.minify).toBe('terser');
    expect(resolved.compilerOptions.cssMinify).toBe('lightningcss');
    expect(resolved.compilerOptions.sourceMap).toBe('hidden');
    expect(resolved.compilerOptions.terserOptions).toEqual({
      compress: { drop_console: true },
    });
  });

  it('falls back to empty terser options when omitted', () => {
    const config = createConfig({
      compilerOptions: {
        tsConfig: 'tsconfig.json',
        assets: [],
        minify: 'terser',
        cssMinify: true,
        sourceMap: false,
        terserOptions: {},
      },
      environments: {
        production: {
          compilerOptions: {
            minify: 'terser',
          },
          platforms: {
            chrome: {
              outDir: 'dist/chrome',
              manifest: 'manifest.chrome.json',
            },
          },
        },
      },
    });

    const resolved = resolveConfig(config, 'chrome', 'production');
    expect(resolved.compilerOptions.terserOptions).toEqual({});
  });

  it('respects root-level ui.parallelBuild override', () => {
    const config = createConfig({
      ui: {
        parallelBuild: false,
      },
    });

    const resolved = resolveConfig(config, 'chrome', 'production');
    expect(resolved.ui.parallelBuild).toBe(false);
  });

  it('applies ui.parallelBuild precedence root -> environment -> platform', () => {
    const config = createConfig({
      ui: {
        parallelBuild: true,
      },
      environments: {
        production: {
          ui: {
            parallelBuild: false,
          },
          compilerOptions: {
            minify: true,
            cssMinify: true,
            sourceMap: false,
          },
          platforms: {
            chrome: {
              outDir: 'dist/chrome',
              manifest: 'manifest.chrome.json',
              ui: {
                parallelBuild: true,
              },
            },
          },
        },
      },
    });

    const resolved = resolveConfig(config, 'chrome', 'production');
    expect(resolved.ui.parallelBuild).toBe(true);
  });
});

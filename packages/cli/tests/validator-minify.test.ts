import { beforeEach, describe, expect, it, vi } from 'vitest';

const bundleMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../src/bundler', () => ({
  bundleBootstrapFiles: bundleMock,
}));

import { minifyValidatorArtifacts } from '../src/build/validator-minify';

describe('minifyValidatorArtifacts', () => {
  beforeEach(() => {
    bundleMock.mockClear();
  });

  it('invokes bundler for validator artifacts when minify is enabled', async () => {
    const validatorArtifactPaths = [
      'D:/repo/dist/background/background.validators.js',
      'D:/repo/dist/content/content.validators.js',
      'D:/repo/dist/background/background.validators.js',
    ];

    await minifyValidatorArtifacts({
      outputDir: 'D:/repo/dist',
      validatorArtifactPaths,
      resolved: {
        tsConfig: 'tsconfig.json',
        platform: 'chrome',
        compilerOptions: {
          minify: 'esbuild',
          sourceMap: false,
          cssMinify: true,
          terserOptions: {},
        },
      } as any,
    });

    expect(bundleMock).toHaveBeenCalledTimes(1);
    expect(bundleMock).toHaveBeenCalledWith(expect.objectContaining({
      outputDir: 'D:/repo/dist',
      entryPoints: [
        'D:/repo/dist/background/background.validators.js',
        'D:/repo/dist/content/content.validators.js',
      ],
      minify: 'esbuild',
      context: 'background',
      tsConfigPath: 'tsconfig.json',
      platform: 'chrome',
      preserveEntrySignatures: 'strict',
    }));
  });

  it('skips validator minification when minify is disabled', async () => {
    await minifyValidatorArtifacts({
      outputDir: 'D:/repo/dist',
      validatorArtifactPaths: ['D:/repo/dist/background/background.validators.js'],
      resolved: {
        tsConfig: 'tsconfig.json',
        platform: 'chrome',
        compilerOptions: {
          minify: false,
          sourceMap: true,
          cssMinify: false,
          terserOptions: {},
        },
      } as any,
    });

    expect(bundleMock).not.toHaveBeenCalled();
  });
});
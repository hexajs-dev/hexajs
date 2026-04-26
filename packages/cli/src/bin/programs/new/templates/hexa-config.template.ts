import type { ScaffoldContext } from '../models/scaffold.types';

export const hexaConfigTemplate = (ctx: ScaffoldContext): string => {
  // Build per-environment platform entries
  const envPlatforms: Record<string, { outDir: string; manifest: string; tokens: never[] }> = {};

  for (const platform of ctx.platforms) {
    envPlatforms[platform] = {
      outDir: `dist/${platform}`,
      manifest: `manifest.${platform}.json`,
      tokens: [],
    };
  }

  // For blank projects without a popup, mode is 'none'; otherwise always managed.
  const popupMode = ctx.blank && !ctx.reactPopup ? 'none' : 'managed';
  const popupSection =
    popupMode === 'managed'
      ? { mode: 'managed', sourceDir: 'ui/popup', indexFile: 'index.html', icons: 'src/assets/hexa-logo.svg' }
      : { mode: 'none', icons: 'src/assets/hexa-logo.svg' };

  const uiSection = {
    ui: {
      popup: popupSection,
      devtools: ctx.managedDevtools
        ? { mode: 'managed', sourceDir: 'ui/devtools', indexFile: 'index.html' }
        : { mode: 'none' },
    },
  };

  return JSON.stringify(
    {
      $schema: './node_modules/@hexajs-dev/cli/schema/hexa-cli.schema.json',
      project: {
        name: ctx.name,
        version: '0.0.1',
        sourceRoot: 'src',
      },
      compilerOptions: {
        tsConfig: 'tsconfig.json',
        assets: ['src/assets/**/*'],
        minify: false,
        cssMinify: false,
        sourceMap: true,
        terserOptions: {},
      },
      tokens: [],
      ...uiSection,
      environments: {
        development: {
          compilerOptions: { minify: false, cssMinify: false, sourceMap: true },
          tokens: [],
          platforms: envPlatforms,
        },
        production: {
          compilerOptions: { minify: true, cssMinify: true, sourceMap: false },
          tokens: [],
          platforms: envPlatforms,
        },
      },
      defaultMode: 'production',
      defaultPlatform: ctx.platforms[0],
    },
    null,
    2
  );
};

import type { ScaffoldContext } from '../models/scaffold.types';

export const hexaConfigTemplate = (ctx: ScaffoldContext): string => {
  // Build per-environment platform entries
  const envPlatforms: Record<string, { outDir: string; manifest: string; tokens: never[] }> = {};
  const defaultPlatform = ctx.platforms.includes('chrome')
    ? 'chrome'
    : ctx.platforms.includes('firefox')
      ? 'firefox'
      : ctx.platforms[0];

  for (const platform of ctx.platforms) {
    envPlatforms[platform] = {
      outDir: `dist/${platform}`,
      manifest: `manifest.${platform}.json`,
      tokens: [],
    };
  }

  // Managed popup is only scaffolded when the user opts into a popup template.
  const popupMode = ctx.reactPopup ? 'managed' : 'none';
  const popupSection =
    popupMode === 'managed'
      ? { mode: 'managed', sourceDir: 'ui/popup', indexFile: 'index.html', icons: 'src/assets/hexa-logo.svg' }
      : { mode: 'none', icons: 'src/assets/hexa-logo.svg' };

  const hasManagedSurface = ctx.reactPopup || ctx.managedDevtools || ctx.managedNewtab;

  // Only emit `ui.framework` when at least one managed surface is configured.
  // Existing projects without managed UI keep their config minimal.
  const uiBlock: Record<string, unknown> = {
    popup: popupSection,
    devtools: ctx.managedDevtools
      ? { mode: 'managed', sourceDir: 'ui/devtools', indexFile: 'index.html' }
      : { mode: 'none' },
    newtab: ctx.managedNewtab
      ? { mode: 'managed', sourceDir: 'ui/newtab', indexFile: 'index.html' }
      : { mode: 'none' },
  };
  if (hasManagedSurface) {
    uiBlock.framework = ctx.framework;
  }

  const uiSection = { ui: uiBlock };

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
      defaultPlatform,
    },
    null,
    2
  );
};

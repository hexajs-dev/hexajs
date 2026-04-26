import * as fs from 'fs';
import * as path from 'path';
import { build as viteBuild } from 'vite';
import type { HexaUiCompilerOptions, HexaUiSurfaceConfig } from '../core/types';
import { createFallbackSurface } from '../core/fallback';
import { normalizeManifestPath } from '../core/normalize';
import { loadReactPlugin } from '../core/react-plugin';
import { hexaBootstrapPlugin } from '../core/vendor';
import { getDefaultViteConfig, loadUserViteConfig, mergeViteConfigs } from '../core/config';

/**
 * Build the React popup from `config.sourceDir` using an internal Vite build,
 * resolving `@vitejs/plugin-react` from the user's project.
 * Returns the manifest-relative entry path (e.g. "ui/popup/index.html").
 */
export async function buildManagedPopup(
  config: HexaUiSurfaceConfig | undefined,
  outputDir: string,
  compilerOptions: HexaUiCompilerOptions,
  bootstrapPath: string,
  platform: string,
  watch: boolean = false,
  hmrAddress?: string,
  hmrSessionToken?: string,
  cwd: string = process.cwd()
): Promise<string> {
  const sourceDir = path.resolve(cwd, config?.sourceDir ?? path.join('ui', 'popup'));
  const indexFile = config?.indexFile ?? 'index.html';
  const sourceIndex = path.join(sourceDir, indexFile);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    console.warn(`⚠ Managed popup source directory not found at ${sourceDir}. Falling back to generated HTML.`);
    return createFallbackSurface('popup', outputDir);
  }

  if (!fs.existsSync(sourceIndex) || !fs.statSync(sourceIndex).isFile()) {
    console.warn(`⚠ Managed popup entry file not found at ${sourceIndex}. Falling back to generated HTML.`);
    return createFallbackSurface('popup', outputDir);
  }

  const targetBase = path.join(outputDir, 'ui', 'popup');
  const normalizedIndex = indexFile.replace(/\\/g, '/');
  const react = loadReactPlugin(cwd);
  const bootstrap = hexaBootstrapPlugin(bootstrapPath, { watch, hmrAddress, hmrSessionToken, surface: 'popup' });

  const defaultViteConfig = getDefaultViteConfig(
    sourceDir,
    targetBase,
    compilerOptions,
    { popup: path.join(sourceDir, normalizedIndex) },
    [react, bootstrap],
    { __HEXA_PLATFORM__: JSON.stringify(platform) }
  );
  const userViteConfig = await loadUserViteConfig(sourceDir, watch ? 'development' : 'production') ?? {};

  await viteBuild(mergeViteConfigs(defaultViteConfig, userViteConfig));

  const builtEntry = path.join(targetBase, normalizedIndex);
  if (!fs.existsSync(builtEntry) || !fs.statSync(builtEntry).isFile()) {
    throw new Error(`Managed popup build completed but entry was not found: ${builtEntry}`);
  }

  const manifestEntry = normalizeManifestPath(path.posix.join('ui', 'popup', normalizedIndex));
  console.log(`✓ Built managed popup UI: ${sourceDir} → ${targetBase}`);
  return manifestEntry;
}

import * as fs from 'fs';
import * as path from 'path';
import { build as viteBuild } from 'vite';
import type { HexaUiSurfaceConfig } from '../core/types';
import { createFallbackSurface } from '../core/fallback';
import { loadReactPlugin } from '../core/react-plugin';
import { normalizeManifestPath } from '../core/normalize';
import { hexaBootstrapPlugin } from '../core/vendor';
import { getDefaultViteConfig, loadUserViteConfig, mergeViteConfigs } from '../core/config';

/**
 * Build a managed devtools panel from `config.sourceDir` using an internal Vite build.
 * Returns the manifest-relative entry path (e.g. "ui/devtools/index.html").
 */
export async function buildManagedDevtools(config: HexaUiSurfaceConfig | undefined, outputDir: string, minify: boolean, bootstrapPath: string, platform: string, watch: boolean = false, hmrAddress?: string, hmrSessionToken?: string, cwd: string = process.cwd()): Promise<string> {
  const sourceDir = path.resolve(cwd, config?.sourceDir ?? path.join('ui', 'devtools'));
  const indexFile = config?.indexFile ?? 'index.html';
  const sourceIndex = path.join(sourceDir, indexFile);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    console.warn(`⚠ Managed devtools source directory not found at ${sourceDir}. Falling back to generated HTML.`);
    return createFallbackSurface('devtools', outputDir);
  }

  if (!fs.existsSync(sourceIndex) || !fs.statSync(sourceIndex).isFile()) {
    console.warn(`⚠ Managed devtools entry file not found at ${sourceIndex}. Falling back to generated HTML.`);
    return createFallbackSurface('devtools', outputDir);
  }

  const targetBase = path.join(outputDir, 'ui', 'devtools');
  const normalizedIndex = indexFile.replace(/\\/g, '/');
  const bridgeHtml = path.join(sourceDir, 'devtools.html');
  const react = loadReactPlugin(cwd);
  const bootstrap = hexaBootstrapPlugin(bootstrapPath, { watch, hmrAddress, hmrSessionToken, surface: 'devtools' });

  // Build both the bridge entry (devtools.html → devtools.ts) and the panel
  // (index.html → src/main.tsx) in one Vite pass, sharing the vendor plugin.
  const inputs: Record<string, string> = {
    panel: path.join(sourceDir, normalizedIndex),
  };
  if (fs.existsSync(bridgeHtml)) {
    inputs['devtools'] = bridgeHtml;
  }

  const defaultViteConfig = getDefaultViteConfig(sourceDir, targetBase, minify, inputs, [react, bootstrap], { __HEXA_PLATFORM__: JSON.stringify(platform) });
  const userViteConfig = await loadUserViteConfig(sourceDir, watch ? 'development' : 'production') ?? {};

  await viteBuild(mergeViteConfigs(defaultViteConfig, userViteConfig));

  const builtEntry = path.join(targetBase, normalizedIndex);
  if (!fs.existsSync(builtEntry) || !fs.statSync(builtEntry).isFile()) {
    throw new Error(`Managed devtools build completed but entry was not found: ${builtEntry}`);
  }

  // Manifest devtools_page points to the bridge HTML (devtools.html)
  const bridgeManifestEntry = fs.existsSync(path.join(targetBase, 'devtools.html'))
    ? normalizeManifestPath(path.posix.join('ui', 'devtools', 'devtools.html'))
    : normalizeManifestPath(path.posix.join('ui', 'devtools', normalizedIndex));

  console.log(`✓ Built managed devtools UI: ${sourceDir} → ${targetBase}`);
  return bridgeManifestEntry;
}

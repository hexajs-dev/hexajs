import * as fs from 'fs';
import * as path from 'path';
import { build as viteBuild } from 'vite';
import type { HexaUiCompilerOptions, HexaUiSurfaceConfig } from '../core/types';
import { createFallbackSurface } from '../core/fallback';
import { getAdapter, type UiFrameworkName } from '../core/framework-adapter';
import { normalizeManifestPath } from '../core/normalize';
import { hexaBootstrapPlugin } from '../core/vendor';
import { getDefaultViteConfig, loadUserViteConfig, mergeViteConfigs } from '../core/config';

function resolveForComparison(filePath: string): string {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

function isPathWithinRoot(rootPath: string, candidatePath: string): boolean {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Build a managed devtools panel from `config.sourceDir` using an internal Vite build.
 * Returns the manifest-relative entry path (e.g. "ui/devtools/index.html").
 */
export async function buildManagedDevtools(config: HexaUiSurfaceConfig | undefined, outputDir: string, compilerOptions: HexaUiCompilerOptions, bootstrapPath: string, platform: string, watch: boolean = false, hmrAddress?: string, hmrSessionToken?: string, cwd: string = process.cwd(), framework: UiFrameworkName = 'react'): Promise<string> {
  const projectRoot = resolveForComparison(cwd);
  const sourceDir = path.resolve(projectRoot, config?.sourceDir ?? path.join('ui', 'devtools'));
  const sourceDirReal = resolveForComparison(sourceDir);
  if (!isPathWithinRoot(projectRoot, sourceDirReal)) {
    throw new Error(`Managed devtools sourceDir must stay inside project root: ${config?.sourceDir ?? path.join('ui', 'devtools')}`);
  }

  const indexFile = config?.indexFile ?? 'index.html';
  const normalizedIndex = indexFile.replace(/\\+/g, '/');
  const sourceIndex = path.resolve(sourceDirReal, normalizedIndex);
  if (!isPathWithinRoot(sourceDirReal, sourceIndex)) {
    throw new Error(`Managed devtools indexFile must stay inside sourceDir: ${indexFile}`);
  }

  const sourceIndexReal = resolveForComparison(sourceIndex);
  if (!isPathWithinRoot(sourceDirReal, sourceIndexReal)) {
    throw new Error(`Managed devtools indexFile resolves outside sourceDir: ${sourceIndexReal}`);
  }

  if (!fs.existsSync(sourceDirReal) || !fs.statSync(sourceDirReal).isDirectory()) {
    console.warn(`⚠ Managed devtools source directory not found at ${sourceDirReal}. Falling back to generated HTML.`);
    return createFallbackSurface('devtools', outputDir);
  }

  if (!fs.existsSync(sourceIndexReal) || !fs.statSync(sourceIndexReal).isFile()) {
    console.warn(`⚠ Managed devtools entry file not found at ${sourceIndexReal}. Falling back to generated HTML.`);
    return createFallbackSurface('devtools', outputDir);
  }

  const targetBase = path.join(outputDir, 'ui', 'devtools');
  const bridgeHtml = path.join(sourceDirReal, 'devtools.html');
  const adapter = getAdapter(framework);
  const frameworkPlugin = adapter.loadVitePlugin(cwd);
  const bootstrap = hexaBootstrapPlugin(bootstrapPath, { watch, hmrAddress, hmrSessionToken, surface: 'devtools' });

  // Build both the bridge entry (devtools.html → devtools.ts) and the panel
  // (index.html → src/main.{tsx,ts}) in one Vite pass, sharing the vendor plugin.
  const inputs: Record<string, string> = {
    panel: sourceIndexReal,
  };
  if (fs.existsSync(bridgeHtml)) {
    inputs['devtools'] = bridgeHtml;
  }

  const defaultViteConfig = getDefaultViteConfig(sourceDirReal, targetBase, compilerOptions, inputs, [frameworkPlugin, bootstrap], { __HEXA_PLATFORM__: JSON.stringify(platform) }, [...adapter.dedupe]);
  const userViteConfig = await loadUserViteConfig(sourceDirReal, watch ? 'development' : 'production') ?? {};

  await viteBuild(mergeViteConfigs(defaultViteConfig, userViteConfig));

  const builtEntry = path.join(targetBase, normalizedIndex);
  if (!fs.existsSync(builtEntry) || !fs.statSync(builtEntry).isFile()) {
    throw new Error(`Managed devtools build completed but entry was not found: ${builtEntry}`);
  }

  // Manifest devtools_page points to the bridge HTML (devtools.html)
  const bridgeManifestEntry = fs.existsSync(path.join(targetBase, 'devtools.html'))
    ? normalizeManifestPath(path.posix.join('ui', 'devtools', 'devtools.html'))
    : normalizeManifestPath(path.posix.join('ui', 'devtools', normalizedIndex));

  console.log(`✓ Built managed devtools UI: ${sourceDirReal} → ${targetBase}`);
  return bridgeManifestEntry;
}

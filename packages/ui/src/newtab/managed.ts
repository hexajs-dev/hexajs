import * as fs from 'fs';
import * as path from 'path';
import { build as viteBuild } from 'vite';
import type { HexaUiCompilerOptions, HexaUiSurfaceConfig } from '../core/types';
import { createFallbackSurface } from '../core/fallback';
import { normalizeManifestPath } from '../core/normalize';
import { getAdapter, type UiFrameworkName } from '../core/framework-adapter';
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
 * Build the managed new tab page from `config.sourceDir` using an internal Vite build,
 * resolving the framework's Vite plugin from the user's project.
 * Returns the manifest-relative entry path (e.g. "ui/newtab/index.html").
 */
export async function buildManagedNewtab(
  config: HexaUiSurfaceConfig | undefined,
  outputDir: string,
  compilerOptions: HexaUiCompilerOptions,
  bootstrapPath: string,
  platform: string,
  watch: boolean = false,
  hmrAddress?: string,
  hmrSessionToken?: string,
  cwd: string = process.cwd(),
  framework: UiFrameworkName = 'react'
): Promise<string> {
  const projectRoot = resolveForComparison(cwd);
  const sourceDir = path.resolve(projectRoot, config?.sourceDir ?? path.join('ui', 'newtab'));
  const sourceDirReal = resolveForComparison(sourceDir);
  if (!isPathWithinRoot(projectRoot, sourceDirReal)) {
    throw new Error(`Managed newtab sourceDir must stay inside project root: ${config?.sourceDir ?? path.join('ui', 'newtab')}`);
  }

  const indexFile = config?.indexFile ?? 'index.html';
  const normalizedIndex = indexFile.replace(/\\+/g, '/');
  const sourceIndex = path.resolve(sourceDirReal, normalizedIndex);
  if (!isPathWithinRoot(sourceDirReal, sourceIndex)) {
    throw new Error(`Managed newtab indexFile must stay inside sourceDir: ${indexFile}`);
  }

  const sourceIndexReal = resolveForComparison(sourceIndex);
  if (!isPathWithinRoot(sourceDirReal, sourceIndexReal)) {
    throw new Error(`Managed newtab indexFile resolves outside sourceDir: ${sourceIndexReal}`);
  }

  if (!fs.existsSync(sourceDirReal) || !fs.statSync(sourceDirReal).isDirectory()) {
    console.warn(`⚠ Managed newtab source directory not found at ${sourceDirReal}. Falling back to generated HTML.`);
    return createFallbackSurface('newtab', outputDir);
  }

  if (!fs.existsSync(sourceIndexReal) || !fs.statSync(sourceIndexReal).isFile()) {
    console.warn(`⚠ Managed newtab entry file not found at ${sourceIndexReal}. Falling back to generated HTML.`);
    return createFallbackSurface('newtab', outputDir);
  }

  const targetBase = path.join(outputDir, 'ui', 'newtab');
  const adapter = getAdapter(framework);
  const frameworkPlugin = adapter.loadVitePlugin(cwd);
  const bootstrap = hexaBootstrapPlugin(bootstrapPath, { watch, hmrAddress, hmrSessionToken, surface: 'newtab' });

  const defaultViteConfig = getDefaultViteConfig(
    sourceDirReal,
    targetBase,
    compilerOptions,
    { newtab: sourceIndexReal },
    [frameworkPlugin, bootstrap],
    { __HEXA_PLATFORM__: JSON.stringify(platform) },
    [...adapter.dedupe]
  );
  const userViteConfig = await loadUserViteConfig(sourceDirReal, watch ? 'development' : 'production') ?? {};

  await viteBuild(mergeViteConfigs(defaultViteConfig, userViteConfig));

  const builtEntry = path.join(targetBase, normalizedIndex);
  if (!fs.existsSync(builtEntry) || !fs.statSync(builtEntry).isFile()) {
    throw new Error(`Managed newtab build completed but entry was not found: ${builtEntry}`);
  }

  const manifestEntry = normalizeManifestPath(path.posix.join('ui', 'newtab', normalizedIndex));
  console.log(`✓ Built managed new tab UI: ${sourceDirReal} → ${targetBase}`);
  return manifestEntry;
}

import { build, type InlineConfig, type Plugin } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import ts from 'typescript';
import { CssMinifyOption, SourceMapOption } from './bin/config/config';
import { assertPathWithinRoot } from './shared/path-utils';

export interface BundleOptions {
  /** Absolute path to the output directory containing the bootstrap files */
  outputDir: string;
  /** List of absolute paths to bootstrap entry point files */
  entryPoints: string[];
  /** Whether to minify the output */
  minify: false | 'esbuild' | 'terser';
  /** Source map strategy for Vite build output */
  sourceMap: SourceMapOption;
  /** CSS minification strategy for Vite build output */
  cssMinify: CssMinifyOption;
  /** Optional terser options when minify strategy is "terser" */
  terserOptions: Record<string, unknown>;
  /** Absolute path to the project root (where node_modules lives) */
  projectRoot: string;
  /** Target browser platform used for compile-time branch pruning */
  platform: string;
  /**
   * Optional extra Vite plugins resolved from the **user project's** node_modules.
   * The CLI never bundles framework plugins (e.g. @vitejs/plugin-react) itself —
   * they are loaded at build time via `createRequire` rooted at the project CWD.
   */
  plugins?: Plugin[];
  /**
   * Build context that controls output format and chunk strategy.
   *
   * - `'background'` — ES module format with a shared vendor chunk
   *   (`background/hexa-vendor-background.js`).  MV3 service workers require modules.
   * - `'content'`    — IIFE format, fully self-contained (no imports).
   *   Content scripts run in the page and cannot load ES module imports
   *   unless the browser supports `type: "module"` content scripts
   *   (Chrome 120+). IIFE is universally compatible.
   * - `'worker'`     — ES module format with a shared vendor chunk
   *   (`background/hexa-vendor-worker.js`).  Worker scripts use dynamic imports.
   *
   * UI surfaces (popup/devtools/options) are intentionally excluded from this
   * bundler path. They are treated as prebuilt assets and copied to output
   * using UI config (`distDir` + `indexFile`) in buildAction.
   */
  context?: 'background' | 'content' | 'worker';
  /** Path to the project's tsconfig file (relative to projectRoot or absolute). */
  tsConfigPath?: string;
  /** Optional Rollup preserveEntrySignatures mode override for specialized entry builds. */
  preserveEntrySignatures?: false | 'strict' | 'exports-only' | 'allow-extension';
}

interface TsPathMapping {
  isWildcard: boolean;
  find: string;
  replacement: string;
}

function normalizePathWithSlash(input: string): string {
  const normalized = input.replace(/\\/g, '/');
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function resolveAliasedFile(candidate: string): string | null {
  const normalizedCandidate = candidate.replace(/\\/g, '/');
  const candidates = [
    normalizedCandidate,
    `${normalizedCandidate}.ts`,
    `${normalizedCandidate}.tsx`,
    `${normalizedCandidate}.js`,
    `${normalizedCandidate}.mjs`,
    `${normalizedCandidate}.cjs`,
    `${normalizedCandidate}/index.ts`,
    `${normalizedCandidate}/index.tsx`,
    `${normalizedCandidate}/index.js`,
    `${normalizedCandidate}/index.mjs`,
    `${normalizedCandidate}/index.cjs`,
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }

  return null;
}

function loadTsPathMappings(projectRoot: string, tsConfigPath?: string): TsPathMapping[] {
  const normalizedProjectRoot = path.resolve(projectRoot);
  const requestedConfigPath = tsConfigPath || 'tsconfig.json';
  const resolvedConfigPath = path.resolve(normalizedProjectRoot, requestedConfigPath);

  assertPathWithinRoot(
    normalizedProjectRoot,
    resolvedConfigPath,
    `Invalid tsConfigPath "${requestedConfigPath}". tsConfig path must stay within the project root.`
  );

  if (!fs.existsSync(resolvedConfigPath)) {
    return [];
  }

  const configResult = ts.readConfigFile(resolvedConfigPath, ts.sys.readFile);
  const rawConfig = configResult.config as { compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> } } | undefined;
  const compilerOptions = rawConfig?.compilerOptions;
  if (!compilerOptions?.paths) {
    return [];
  }

  const baseUrl = path.resolve(path.dirname(resolvedConfigPath), compilerOptions.baseUrl || '.');
  const mappings: TsPathMapping[] = [];

  for (const [key, values] of Object.entries(compilerOptions.paths)) {
    if (!Array.isArray(values) || values.length === 0) {
      continue;
    }
    const target = values[0];
    if (!target) {
      continue;
    }

    if (key.includes('*')) {
      const findPrefix = normalizePathWithSlash(key.replace('*', ''));
      const replacementPrefix = normalizePathWithSlash(path.resolve(baseUrl, target.replace('*', '')));
      mappings.push({ isWildcard: true, find: findPrefix, replacement: replacementPrefix });
    } else {
      mappings.push({ isWildcard: false, find: key, replacement: path.resolve(baseUrl, target).replace(/\\/g, '/') });
    }
  }

  return mappings;
}

/**
 * Bundles bootstrap files for MV3 browser extensions.
 *
 * A separate Rollup pass is used per context (background / content):
 *  - **Background** → ES module format with a `background/hexa-vendor-background.js`
 *    shared chunk.  MV3 service workers require `"type": "module"`.
 *  - **Content** → IIFE format, fully self-contained (all dependencies
 *    inlined). This avoids the `import` statement that breaks content
 *    scripts on browsers that don't support module content scripts.
 *  - Inline source-maps are embedded in every output file.
 */
export async function bundleBootstrapFiles(options: BundleOptions): Promise<void> {
  const { outputDir, entryPoints, projectRoot, plugins = [], context, platform, tsConfigPath } = options;

  if (entryPoints.length === 0) return;

  // Map basename → absolute path so Rollup output names stay clean
  const inputs: Record<string, string> = {};
  for (const entry of entryPoints) {
    const relativeEntry = path.relative(outputDir, entry).replace(/\\/g, '/').replace(/\.js$/i, '');
    inputs[relativeEntry] = entry;
  }

  // Content scripts are bundled as IIFE (self-contained, no imports).
  // Background service workers must use ES modules.
  const isContent = context === 'content';
  const vendorChunkName = context ? `background/hexa-vendor-${context}` : 'background/hexa-vendor';
  const tsPathMappings = loadTsPathMappings(projectRoot, tsConfigPath);
  const tsPathResolverPlugin: Plugin = {
    name: 'hexa-ts-paths-resolver',
    enforce: 'pre',
    resolveId(source) {
      for (const mapping of tsPathMappings) {
        if (mapping.isWildcard) {
          if (source.startsWith(mapping.find)) {
            const suffix = source.slice(mapping.find.length);
            return resolveAliasedFile(path.posix.normalize(`${mapping.replacement}${suffix}`));
          }
          continue;
        }

        if (source === mapping.find) {
          return resolveAliasedFile(mapping.replacement);
        }
      }
      return null;
    },
  };

  if (options.minify !== 'terser' && Object.keys(options.terserOptions).length > 0) {
    console.warn('[Hexa CLI] compilerOptions.terserOptions is ignored unless compilerOptions.minify is set to "terser".');
  }

  const createConfig = (rollupInput: Record<string, string>): InlineConfig => ({
    configFile: false,    // never pick up a local vite.config.ts
    root: projectRoot,
    logLevel: 'warn',
    clearScreen: false,
    plugins: [tsPathResolverPlugin, ...plugins],
    define: {
      __HEXA_PLATFORM__: JSON.stringify(platform),
    },
    build: {
      outDir: outputDir,
      emptyOutDir: false,   // lifecycle managed by buildAction
      minify: options.minify,
      sourcemap: options.sourceMap,
      cssMinify: options.cssMinify,
      ...(options.minify === 'terser' ? { terserOptions: options.terserOptions } : {}),
      rollupOptions: {
        ...(options.preserveEntrySignatures !== undefined
          ? { preserveEntrySignatures: options.preserveEntrySignatures }
          // Worker scripts export a `methods` map consumed via dynamic import()
          // from hexa.worker.js. Rollup cannot trace this statically, so we must
          // preserve entry exports to prevent tree-shaking them away.
          : (context === 'worker' ? { preserveEntrySignatures: 'exports-only' as const } : {})),
        input: rollupInput,
        output: [
          isContent
            ? {
                // IIFE — everything inlined, no external imports
                format: 'iife' as const,
                entryFileNames: '[name].js',
              }
            : {
                // ES modules — vendor chunk extracted for background
                format: 'es' as const,
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                manualChunks(id) {
                  const normalizedId  = id.replace(/\\/g, '/');
                  const normalizedSrc = (projectRoot + '/src').replace(/\\/g, '/');
                  const normalizedOut = outputDir.replace(/\\/g, '/');
                  const isUserSrc  = normalizedId.startsWith(normalizedSrc);
                  const isEntry    = normalizedId.startsWith(normalizedOut);
                  if (!isUserSrc && !isEntry) return vendorChunkName;
                },
              },
        ],
      },
    },
  });

  if (isContent && entryPoints.length > 1) {
    for (const [entryName, entryPath] of Object.entries(inputs)) {
      await build(createConfig({ [entryName]: entryPath }));
    }
    return;
  }

  await build(createConfig(inputs));
}

/**
 * Removes intermediate generated files that are no longer needed
 * after bundling (e.g., store bootstrap stubs now inlined into bundles).
 */
export function cleanIntermediateFiles(outputDir: string, patterns: string[]): void {
  for (const pattern of patterns) {
    const filePath = path.join(outputDir, pattern);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

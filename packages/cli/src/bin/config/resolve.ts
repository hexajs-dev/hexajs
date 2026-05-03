import * as path from 'path';
import { HexaConfig, ConfigToken, UiConfig, MinifyOption, CssMinifyOption, SourceMapOption } from './config';

// ─── Resolved Build Config ────────────────────────────────────────────────────

export interface ResolvedBuildConfig {
    /** Fully resolved tsconfig file path (relative to project root) */
    tsConfig: string;
    /** Fully resolved manifest file path (relative to project root) */
    manifest: string;
    /** Fully resolved output directory (relative to project root), e.g. "dist/chrome/production" */
    outDir: string;
    /** Merged compiler options */
    compilerOptions: {
        tsConfig: string;
        assets: string[];
        minify: false | 'esbuild' | 'terser';
        cssMinify: CssMinifyOption;
        sourceMap: SourceMapOption;
        terserOptions: Record<string, unknown>;
    };
    /** Merged tokens list — fully resolved from all layers */
    tokens: ConfigToken[];
    /** The resolved platform name */
    platform: string;
    /** The resolved mode name */
    mode: string;
    /** Project metadata (passthrough) */
    project: HexaConfig['project'];

    /** Resolved UI surface configuration */
    ui: UiConfig;

    debug?: boolean;
}

function mergeUiConfig(...layers: (UiConfig | undefined)[]): UiConfig {
    const merged: UiConfig = {};

    for (const layer of layers) {
        if (!layer) continue;

        if (layer.parallelBuild !== undefined) {
            merged.parallelBuild = layer.parallelBuild;
        }

        if (layer.popup) {
            merged.popup = {
                ...(merged.popup || {}),
                ...layer.popup,
            };
        }

        if (layer.devtools) {
            merged.devtools = {
                ...(merged.devtools || {}),
                ...layer.devtools,
            };
        }
    }

    return merged;
}

/**
 * Merges token arrays by key. Later entries override earlier entries with the same key.
 * Non-conflicting tokens accumulate.
 */
function mergeTokens(...layers: (ConfigToken[] | undefined)[]): ConfigToken[] {
    const map = new Map<string, ConfigToken>();
    for (const layer of layers) {
        if (!layer) continue;
        for (const token of layer) {
            map.set(token.key, { ...token });
        }
    }
    return Array.from(map.values());
}

function normalizeMinifyOption(minify: MinifyOption): false | 'esbuild' | 'terser' {
    if (minify === false) {
        return false;
    }

    if (minify === 'terser') {
        return 'terser';
    }

    return 'esbuild';
}

function normalizeCompilerOptions(compilerOptions: HexaConfig['compilerOptions']): ResolvedBuildConfig['compilerOptions'] {
    const normalizedMinify = normalizeMinifyOption(compilerOptions.minify);
    const sourceMap = compilerOptions.sourceMap ?? (normalizedMinify === false);
    const cssMinify = compilerOptions.cssMinify ?? (normalizedMinify !== false);
    const terserOptions = compilerOptions.terserOptions ?? {};

    return {
        tsConfig: compilerOptions.tsConfig,
        assets: compilerOptions.assets,
        minify: normalizedMinify,
        cssMinify,
        sourceMap,
        terserOptions,
    };
}

function isPathWithinRoot(rootPath: string, candidatePath: string): boolean {
    const relative = path.relative(rootPath, candidatePath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolveSafeOutDir(baseOutDir: string, mode: string): string {
    const projectRoot = path.resolve(process.cwd());
    const absoluteOutDir = path.resolve(projectRoot, baseOutDir, mode);

    if (!isPathWithinRoot(projectRoot, absoluteOutDir)) {
        throw new Error(`Invalid outDir "${baseOutDir}" for mode "${mode}". Output path must stay within the project root.`);
    }

    return path.relative(projectRoot, absoluteOutDir).replace(/\\/g, '/');
}

// ─── Config Resolution ────────────────────────────────────────────────────────

/**
 * Resolves a fully merged build configuration from the raw HexaConfig,
 * applying the environment (mode) and platform overrides in the correct order.
 *
 * Resolution chains (platforms are only defined within environments):
 *   tsConfig:  compilerOptions.tsConfig → environments[m].tsConfig → environments[m].platforms[p].tsConfig
 *   manifest:  environments[m].manifest → environments[m].platforms[p].manifest
 *   tokens:    root.tokens → environments[m].tokens → environments[m].platforms[p].tokens
 *   compiler:  root.compilerOptions ← partial merge ← environments[m].compilerOptions
 *   outDir:    environments[m].platforms[p].outDir, then /<mode>/ appended
 */
export function resolveConfig(config: HexaConfig, platform: string, mode: string): ResolvedBuildConfig {
    // ── Validate mode ────────────────────────────────────────────────────────
    const envConfig = config.environments?.[mode];
    if (!envConfig) {
        const available = config.environments ? Object.keys(config.environments).join(', ') : '(none)';
        throw new Error(
            `Mode "${mode}" not found in environments. Available modes: ${available}`
        );
    }

    // ── Validate platform within the resolved environment ────────────────────
    const envPlatformConfig = envConfig.platforms?.[platform];
    if (!envPlatformConfig) {
        const available = envConfig.platforms ? Object.keys(envConfig.platforms).join(', ') : '(none)';
        throw new Error(
            `Platform "${platform}" not configured in environment "${mode}". Available platforms: ${available}`
        );
    }

    // ── Resolve tsConfig ─────────────────────────────────────────────────────
    // Chain: root.compilerOptions.tsConfig → env.tsConfig → env.platform.tsConfig
    const tsConfig =
        envPlatformConfig.tsConfig
        ?? envConfig.tsConfig
        ?? config.compilerOptions.tsConfig
        ?? 'tsconfig.json';

    // ── Resolve manifest ─────────────────────────────────────────────────────
    // Chain: env.manifest → env.platform.manifest
    const manifest =
        envPlatformConfig.manifest
        ?? envConfig.manifest
        ?? '';

    // ── Resolve compilerOptions ──────────────────────────────────────────────
    // Root compilerOptions ← partial merge ← environment compilerOptions
    const compilerOptions = {
        ...config.compilerOptions,
        ...(envConfig.compilerOptions || {}),
        // tsConfig is resolved separately above — use the resolved one
        tsConfig,
    };
    const normalizedCompilerOptions = normalizeCompilerOptions(compilerOptions);

    // ── Resolve outDir ───────────────────────────────────────────────────────
    // Chain: environments[m].platforms[p].outDir, then /<mode>/ appended
    const baseOutDir = envPlatformConfig.outDir ?? `dist/${platform}`;
    const outDir = resolveSafeOutDir(baseOutDir, mode);

    // ── Resolve tokens ───────────────────────────────────────────────────────
    // Chain: root.tokens → env.tokens → env.platform.tokens
    const tokens = mergeTokens(
        config.tokens,
        envConfig.tokens,
        envPlatformConfig.tokens,
    );

    const ui = mergeUiConfig(
        config.ui,
        envConfig.ui,
        envPlatformConfig.ui,
    );

    return {
        tsConfig,
        manifest,
        outDir,
        compilerOptions: normalizedCompilerOptions,
        tokens,
        platform,
        mode,
        project: config.project,
        ui,
    };
}

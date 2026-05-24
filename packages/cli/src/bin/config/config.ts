import * as path from 'path';
import * as fs from 'fs-extra';


// ─── Token Types ──────────────────────────────────────────────────────────────

export interface ConfigToken {
    key: string;
    value: string | number | boolean | null | Record<string, any> | any[];
    context?: 'background' | 'content' | 'ui';
}

export type MinifyOption = boolean | 'esbuild' | 'terser';
export type CssMinifyOption = boolean | 'esbuild' | 'lightningcss';
export type SourceMapOption = boolean | 'inline' | 'hidden';

export type UiSurfaceMode = 'managed' | 'external' | 'none';

export type UiFrameworkName = 'react' | 'vue';

export interface UiSurfaceConfig {
    mode?: UiSurfaceMode;
    sourceDir?: string;
    distDir?: string;
    indexFile?: string;
    viteConfig?: string;
    icons?: string;
}

export interface UiConfig {
    parallelBuild?: boolean;
    /**
     * UI framework used by all managed surfaces (popup/devtools/newtab) and the
     * content @View shadow DOM. Project-wide; mixed frameworks per surface are
     * not supported. Defaults to 'react' when omitted (backwards compatible).
     */
    framework?: UiFrameworkName;
    popup?: UiSurfaceConfig;
    devtools?: UiSurfaceConfig;
    newtab?: UiSurfaceConfig;
}

// ─── Environment Types ────────────────────────────────────────────────────────

export interface EnvironmentConfig {
    compilerOptions?: Partial<HexaConfig['compilerOptions']>;
    tsConfig?: string;
    manifest?: string;
    tokens?: ConfigToken[];
    ui?: UiConfig;
    platforms?: {
        [key: string]: PlatformSettings;
    };
}

// ─── Platform Types ───────────────────────────────────────────────────────────

export interface PlatformSettings {
    outDir: string;
    manifest: string;
    tsConfig?: string;
    tokens?: ConfigToken[];
    ui?: UiConfig;
}

// ─── Main Config ──────────────────────────────────────────────────────────────

export interface HexaConfig {
    $schema: string;
    project: {
        name: string;
        version: string;
        sourceRoot: string;
    };
    compilerOptions: {
        tsConfig: string;
        assets: string[];
        minify: MinifyOption;
        cssMinify: CssMinifyOption;
        sourceMap: SourceMapOption;
        terserOptions: Record<string, unknown>;
    };
    tokens?: ConfigToken[];
    ui?: UiConfig;
    environments?: {
        [key: string]: EnvironmentConfig;
    };
    defaultMode?: string;
    defaultPlatform?: 'chrome' | 'firefox' | 'safari' | 'opera' | 'edge' | 'brave';
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: HexaConfig = {
    $schema: './node_modules/@hexajs-dev/cli/schema/hexa-cli.schema.json',
    project: {
        name: 'My HexaJS Extension',
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
        popup: {
            mode: 'managed',
        },
        devtools: {
            mode: 'none',
        },
    },
    environments: {
        development: {
            compilerOptions: {
                minify: false,
                cssMinify: false,
                sourceMap: true,
            },
            tokens: [],
            platforms: {
                chrome: {
                    outDir: 'dist/chrome',
                    manifest: '',
                },
            },
        },
        production: {
            compilerOptions: {
                minify: true,
                cssMinify: true,
                sourceMap: false,
            },
            tokens: [],
            platforms: {
                chrome: {
                    outDir: 'dist/chrome',
                    manifest: '',
                },
            },
        },
    },
    defaultMode: 'production',
};

// ─── Deep Merge ───────────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const FORBIDDEN_CONFIG_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key of Object.keys(source) as (keyof T)[]) {
        if (FORBIDDEN_CONFIG_KEYS.has(String(key))) {
            throw new Error(`Hexa config contains forbidden key "${String(key)}".`);
        }

        const sourceVal = source[key] as any;
        const targetVal = result[key] as any;

        if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
            result[key] = deepMerge(targetVal, sourceVal) as any;
        } else if (sourceVal !== undefined) {
            result[key] = sourceVal;
        }
    }
    return result;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

const CONFIG_FILENAMES = ['hexa-cli.config.json', 'hexa-cli.json'];

export async function loadHexaConfigFrom(cwd: string): Promise<HexaConfig> {
    for (const filename of CONFIG_FILENAMES) {
        const configPath = path.join(cwd, filename);
        if (await fs.pathExists(configPath)) {
            const userConfig = await fs.readJson(configPath);
            return deepMerge(DEFAULT_CONFIG, userConfig);
        }
    }
    return DEFAULT_CONFIG;
}

export async function loadHexaConfig(): Promise<HexaConfig> {
    return loadHexaConfigFrom(process.cwd());
}
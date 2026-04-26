
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { loadConfigFromFile } from 'vite';
import { HexaUiCompilerOptions } from './types';

function stripJsonCommentsAndTrailingCommas(source: string): string {
    const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
    const withoutLineComments = withoutBlockComments.replace(/^\s*\/\/.*$/gm, '');
    return withoutLineComments.replace(/,\s*([}\]])/g, '$1');
}

function loadTsConfigAliases(sourceDir: string): Record<string, string> {
    const tsConfigPath = path.resolve(sourceDir, 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
        return {};
    }

    try {
        const raw = fs.readFileSync(tsConfigPath, 'utf-8');
        const parsed = JSON.parse(stripJsonCommentsAndTrailingCommas(raw)) as {
            compilerOptions?: {
                baseUrl?: string;
                paths?: Record<string, string[]>;
            };
        };

        const compilerOptions = parsed.compilerOptions || {};
        const baseUrl = compilerOptions.baseUrl || '.';
        const paths = compilerOptions.paths || {};
        const aliases: Record<string, string> = {};

        for (const [from, toPaths] of Object.entries(paths)) {
            const firstTarget = Array.isArray(toPaths) ? toPaths[0] : undefined;
            if (!firstTarget) {
                continue;
            }

            const normalizedFrom = from.replace(/\/\*$/, '');
            const normalizedTarget = firstTarget.replace(/\/\*$/, '');
            aliases[normalizedFrom] = path.resolve(sourceDir, baseUrl, normalizedTarget).replace(/\\/g, '/');
        }

        return aliases;
    } catch {
        return {};
    }
}

function toAliasRecord(aliasValue: unknown): Record<string, string> {
    if (!aliasValue) {
        return {};
    }

    if (Array.isArray(aliasValue)) {
        const aliases: Record<string, string> = {};
        aliasValue.forEach((entry: any) => {
            if (entry && typeof entry.find === 'string' && typeof entry.replacement === 'string') {
                aliases[entry.find] = entry.replacement;
            }
        });
        return aliases;
    }

    if (typeof aliasValue === 'object') {
        return { ...(aliasValue as Record<string, string>) };
    }

    return {};
}

export const getDefaultViteConfig = (sourceDir: string, targetBase: string, compilerOptions: HexaUiCompilerOptions, inputs: Record<string, string>, plugins: any[] = [], define: Record<string, string> = {}) => ({
    configFile: false,
    root: sourceDir,
    base: './',
    logLevel: 'warn',
    clearScreen: false,
    plugins: plugins,
    define,
    resolve: {
        alias: loadTsConfigAliases(sourceDir),
    },
    build: {
        outDir: targetBase,
        emptyOutDir: true,
        minify: compilerOptions.minify,
        sourcemap: compilerOptions.sourceMap,
        cssMinify: compilerOptions.cssMinify,
        ...(compilerOptions.minify === 'terser' ? { terserOptions: compilerOptions.terserOptions } : {}),
        rollupOptions: {
            input: inputs,
        },
    },
});

export const loadUserViteConfig = async (configDir: string, mode: 'development' | 'production' = 'production'): Promise<Record<string, any> | null> => {
    // Try .ts first, then .js — matches the file we scaffold
    const candidates = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'];
    const configPath = candidates.map(f => path.resolve(configDir, f)).find(p => fs.existsSync(p));

    if (!configPath) return null;

    // If user config imports `vite` but the extension workspace does not have it,
    // Vite's config loader prints a full stack trace. Skip with a concise warning.
    const configSource = fs.readFileSync(configPath, 'utf-8');
    const importsVite = /from\s+['\"]vite['\"]|require\(['\"]vite['\"]\)/.test(configSource);
    if (importsVite) {
        try {
            const localRequire = createRequire(path.join(configDir, 'package.json'));
            localRequire.resolve('vite');
        } catch {
            console.warn(`⚠ Skipping user Vite config at ${configPath} because it imports "vite" but "vite" is not installed in this extension workspace.`);
            return null;
        }
    }

    try {
        const result = await loadConfigFromFile({ command: 'build', mode }, configPath, configDir);
        return result?.config ?? null;
    } catch (err) {
        console.warn(`⚠ Could not load user Vite config at ${configPath}. Proceeding with default config.`, err);
        return null;
    }
}

export const mergeViteConfigs = (defaultConfig: ReturnType<typeof getDefaultViteConfig>, userConfig: Record<string, any>): any => {
    if(!userConfig || typeof userConfig !== 'object') {
        return defaultConfig;
    }
    
    const userPlugins = userConfig.plugins || [];
    const defaultPlugins = defaultConfig.plugins || [];
    
    // Deduplicate plugins by checking their name property
    const mergedPlugins = [...userPlugins];
    
    defaultPlugins.forEach(defaultPlugin => {
        const pluginExists = userPlugins.some((userPlugin: any) => {
            // Compare by name property if both have it
            if (defaultPlugin?.name && userPlugin?.name) {
                return defaultPlugin.name === userPlugin.name;
            }
            // Otherwise compare by reference
            return defaultPlugin === userPlugin;
        });
        
        if (!pluginExists) {
            mergedPlugins.push(defaultPlugin);
        }
    });
    
    const mergedDefine = {
        ...(userConfig.define || {}),
        ...(defaultConfig.define || {}),
    };

    const mergedResolve = {
        ...(defaultConfig.resolve || {}),
        ...(userConfig.resolve || {}),
        alias: {
            ...toAliasRecord(defaultConfig.resolve?.alias),
            ...toAliasRecord(userConfig.resolve?.alias),
        },
    };

    return {
        ...defaultConfig,
        ...userConfig,
        plugins: mergedPlugins,
        define: mergedDefine,
        resolve: mergedResolve,
    };  
}
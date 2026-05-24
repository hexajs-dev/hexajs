import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { ResolvedBuildConfig } from '../bin/config/resolve';
import { UiSurfaceConfig } from '../bin/config/config';
import { ManifestUiEntries } from '../generators/manifest/generator';
import { MetadataRegistry } from '../compiler/registry';
import { ConfigToken } from '../bin/config/config';
import { StoreScriptOutput } from '../generators/store/generator';
import { UIGenerator } from '../generators/ui/generator';
import { normalizeManifestPath } from '../shared/path-utils';
import { detectProjectPM, getAddDependencyCommand } from '../shared/package-manager';

interface HexaUiModule {
    buildManagedPopup: (config: UiSurfaceConfig | undefined, outputDir: string, compilerOptions: ResolvedBuildConfig['compilerOptions'], bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, hmrSessionToken?: string, cwd?: string, framework?: 'react' | 'vue') => Promise<string>;
    buildManagedDevtools: (config: UiSurfaceConfig | undefined, outputDir: string, compilerOptions: ResolvedBuildConfig['compilerOptions'], bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, hmrSessionToken?: string, cwd?: string, framework?: 'react' | 'vue') => Promise<string>;
    buildManagedNewtab: (config: UiSurfaceConfig | undefined, outputDir: string, compilerOptions: ResolvedBuildConfig['compilerOptions'], bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, hmrSessionToken?: string, cwd?: string, framework?: 'react' | 'vue') => Promise<string>;
}

type ManagedUiSurface = 'popup' | 'devtools' | 'newtab';

const MANAGED_UI_METHODS: Record<ManagedUiSurface, keyof HexaUiModule> = {
    popup: 'buildManagedPopup',
    devtools: 'buildManagedDevtools',
    newtab: 'buildManagedNewtab',
};

interface UiBootstrapBuildOutput {
    hasManagedUi: boolean;
    uiBootstrapContent?: string;
}

function createMissingUiDependencyError(cwd: string): Error {
    const packageManager = detectProjectPM(cwd);
    return new Error(
        `'@hexajs-dev/ui' is not installed in your project but a UI surface is set to managed mode.\n` +
        `Run: ${getAddDependencyCommand(packageManager, '@hexajs-dev/ui')}\n` +
        `Or change the popup mode to "external" or "none" in hexa-cli.config.json.`
    );
}

function isModuleNotFoundForRequest(error: unknown, request: string): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    const withSingleQuotes = `Cannot find module '${request}'`;
    const withDoubleQuotes = `Cannot find module \"${request}\"`;
    return (error as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND' && (error.message.includes(withSingleQuotes) || error.message.includes(withDoubleQuotes));
}

function getManagedUiHelperPath(packageRoot: string, surface: ManagedUiSurface): string {
    return path.join(packageRoot, 'dist', 'src', surface, 'managed.cjs');
}

function hasRequiredManagedUiHelpers(hexaUi: Partial<HexaUiModule>, requiredSurfaces: readonly ManagedUiSurface[]): hexaUi is HexaUiModule {
    return requiredSurfaces.every(surface => typeof hexaUi[MANAGED_UI_METHODS[surface]] === 'function');
}

function tryLoadManagedUiHelpersFromDist(packageRoot: string, userRequire: NodeRequire, requiredSurfaces: readonly ManagedUiSurface[]): Partial<HexaUiModule> | null {
    const distHelpers: Partial<HexaUiModule> = {};

    for (const surface of requiredSurfaces) {
        const helperPath = getManagedUiHelperPath(packageRoot, surface);
        let helperModule: Partial<HexaUiModule>;

        try {
            helperModule = userRequire(helperPath) as Partial<HexaUiModule>;
        } catch (error) {
            if (isModuleNotFoundForRequest(error, helperPath)) {
                return null;
            }

            throw error;
        }

        const method = MANAGED_UI_METHODS[surface];
        const helper = helperModule[method];

        if (typeof helper !== 'function') {
            return null;
        }

        distHelpers[method] = helper;
    }

    return distHelpers;
}

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

function copyExternalSurface(surface: 'popup' | 'devtools' | 'newtab', config: UiSurfaceConfig, outputDir: string): string {
    if (!config.distDir) throw new Error(`UI ${surface}: "distDir" is required for external mode.`);
    if (!config.indexFile) throw new Error(`UI ${surface}: "indexFile" is required for external mode.`);

    const sourceDist = path.resolve(process.cwd(), config.distDir);
    if (!fs.existsSync(sourceDist) || !fs.statSync(sourceDist).isDirectory()) {
        throw new Error(`UI ${surface} distDir does not exist or is not a directory: ${sourceDist}`);
    }

    const projectRoot = resolveForComparison(process.cwd());
    const realSourceDist = fs.realpathSync(sourceDist);
    if (!isPathWithinRoot(projectRoot, realSourceDist)) {
        throw new Error(`UI ${surface} distDir must stay within the project root: ${config.distDir}`);
    }

    const sourceIndex = path.resolve(sourceDist, config.indexFile);
    if (!fs.existsSync(sourceIndex)) {
        throw new Error(`UI ${surface} indexFile not found inside distDir: ${sourceIndex}`);
    }

    const realSourceIndex = fs.realpathSync(sourceIndex);
    if (!isPathWithinRoot(realSourceDist, realSourceIndex)) {
        throw new Error(`UI ${surface} indexFile must stay within distDir: ${config.indexFile}`);
    }

    const targetBase = path.join(outputDir, 'ui', surface);
    fs.mkdirSync(targetBase, { recursive: true });
    fs.cpSync(sourceDist, targetBase, { recursive: true, force: true });

    return normalizeManifestPath(path.posix.join('ui', surface, config.indexFile.replace(/\\/g, '/')));
}

function loadHexaUi(cwd: string, requiredSurfaces: readonly ManagedUiSurface[]): HexaUiModule {
    const userRequire = createRequire(path.join(cwd, 'package.json'));

    let packageRoot: string | null = null;
    try {
        const packageJsonPath = userRequire.resolve('@hexajs-dev/ui/package.json');
        packageRoot = path.dirname(packageJsonPath);
    } catch {
        packageRoot = null;
    }

    if (packageRoot) {
        const distHelpers = tryLoadManagedUiHelpersFromDist(packageRoot, userRequire, requiredSurfaces);
        if (distHelpers && hasRequiredManagedUiHelpers(distHelpers, requiredSurfaces)) {
            return distHelpers;
        }
    }

    try {
        const hexaUi = userRequire('@hexajs-dev/ui') as Partial<HexaUiModule>;
        if (hasRequiredManagedUiHelpers(hexaUi, requiredSurfaces)) {
            return hexaUi;
        }

        throw new Error(`Managed UI build helpers are missing from '@hexajs-dev/ui' for: ${requiredSurfaces.join(', ')}.`);
    } catch (error) {
        if (isModuleNotFoundForRequest(error, '@hexajs-dev/ui')) {
            throw createMissingUiDependencyError(cwd);
        }

        const details = error instanceof Error ? error.message : String(error);
        throw new Error(
            `Failed to load managed UI build helpers from '@hexajs-dev/ui'.\n` +
            `${details}`
        );
    }
}

export function buildUiBootstrap(registry: MetadataRegistry, storeOutputs: StoreScriptOutput[], tokens: ConfigToken[], outputDir: string, resolved: ResolvedBuildConfig): UiBootstrapBuildOutput {
    const hasManagedUi = (resolved.ui?.popup?.mode === 'managed') || (resolved.ui?.devtools?.mode === 'managed') || (resolved.ui?.newtab?.mode === 'managed');
    if (!hasManagedUi) {
        return { hasManagedUi: false };
    }

    const uiOutputDir = path.join(outputDir, 'ui');
    const uiGenerator = new UIGenerator(registry, storeOutputs, tokens, uiOutputDir);
    const uiBootstrap = uiGenerator.generate();
    return { hasManagedUi: true, uiBootstrapContent: uiBootstrap.content };
}

export async function buildUiEntries(resolved: ResolvedBuildConfig, outputDir: string, bootstrapPath: string, watch?: boolean, hmrAddress?: string, hmrSessionToken?: string): Promise<ManifestUiEntries> {
    const entries: ManifestUiEntries = {};
    const isWatchBuild = !!watch;
    const cwd = process.cwd();
    const framework = resolved.ui?.framework ?? 'react';

    const popupConfig = resolved.ui?.popup;
    const popupMode = popupConfig?.mode ?? 'none';
    const devtoolsConfig = resolved.ui?.devtools;
    const devtoolsMode = devtoolsConfig?.mode ?? 'none';
    const newtabConfig = resolved.ui?.newtab;
    const newtabMode = newtabConfig?.mode ?? 'none';
    const managedSurfaces: ManagedUiSurface[] = [];

    if (popupMode === 'managed') managedSurfaces.push('popup');
    if (devtoolsMode === 'managed') managedSurfaces.push('devtools');
    if (newtabMode === 'managed') managedSurfaces.push('newtab');

    const hexaUi = managedSurfaces.length > 0
        ? loadHexaUi(cwd, managedSurfaces)
        : undefined;

    const shouldParallelizeManagedUi = resolved.ui?.parallelBuild !== false && !isWatchBuild;

    if (shouldParallelizeManagedUi) {
        const tasks: Promise<void>[] = [];

        if (popupMode === 'managed') {
            tasks.push(
                hexaUi!.buildManagedPopup(popupConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken, cwd, framework)
                    .then(entry => { entries.popup = entry; })
            );
        }
        if (devtoolsMode === 'managed') {
            tasks.push(
                hexaUi!.buildManagedDevtools(devtoolsConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken, cwd, framework)
                    .then(entry => { entries.devtools = entry; })
            );
        }
        if (newtabMode === 'managed') {
            tasks.push(
                hexaUi!.buildManagedNewtab(newtabConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken, cwd, framework)
                    .then(entry => { entries.newtab = entry; })
            );
        }

        await Promise.all(tasks);

        if (popupMode === 'external') entries.popup = copyExternalSurface('popup', popupConfig!, outputDir);
        if (devtoolsMode === 'external') entries.devtools = copyExternalSurface('devtools', devtoolsConfig!, outputDir);
        if (newtabMode === 'external') entries.newtab = copyExternalSurface('newtab', newtabConfig!, outputDir);

        return entries;
    }

    if (popupMode === 'managed') {
        const { buildManagedPopup } = hexaUi!;
        entries.popup = await buildManagedPopup(popupConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken, cwd, framework);
    } else if (popupMode === 'external') {
        entries.popup = copyExternalSurface('popup', popupConfig!, outputDir);
    }

    if (devtoolsMode === 'managed') {
        const { buildManagedDevtools } = hexaUi!;
        entries.devtools = await buildManagedDevtools(devtoolsConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken, cwd, framework);
    } else if (devtoolsMode === 'external') {
        entries.devtools = copyExternalSurface('devtools', devtoolsConfig!, outputDir);
    }

    if (newtabMode === 'managed') {
        const { buildManagedNewtab } = hexaUi!;
        entries.newtab = await buildManagedNewtab(newtabConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken, cwd, framework);
    } else if (newtabMode === 'external') {
        entries.newtab = copyExternalSurface('newtab', newtabConfig!, outputDir);
    }

    return entries;
}

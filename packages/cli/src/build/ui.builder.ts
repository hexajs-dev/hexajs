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
    buildManagedPopup: (config: UiSurfaceConfig | undefined, outputDir: string, compilerOptions: ResolvedBuildConfig['compilerOptions'], bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, hmrSessionToken?: string) => Promise<string>;
    buildManagedDevtools: (config: UiSurfaceConfig | undefined, outputDir: string, compilerOptions: ResolvedBuildConfig['compilerOptions'], bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, hmrSessionToken?: string) => Promise<string>;
}

interface UiBootstrapBuildOutput {
    hasManagedUi: boolean;
    uiBootstrapContent?: string;
}

function createMissingUiDependencyError(cwd: string): Error {
    const packageManager = detectProjectPM(cwd);
    return new Error(
        `'@hexajs-dev/ui' is not installed in your project but popup/devtools is set to managed mode.\n` +
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

function tryLoadManagedUiHelpersFromDist(packageRoot: string, userRequire: NodeRequire): HexaUiModule | null {
    const popupManagedPath = path.join(packageRoot, 'dist', 'src', 'popup', 'managed.cjs');
    const devtoolsManagedPath = path.join(packageRoot, 'dist', 'src', 'devtools', 'managed.cjs');

    if (!fs.existsSync(popupManagedPath) || !fs.existsSync(devtoolsManagedPath)) {
        return null;
    }

    const popupManaged = userRequire(popupManagedPath) as Partial<HexaUiModule>;
    const devtoolsManaged = userRequire(devtoolsManagedPath) as Partial<HexaUiModule>;

    if (typeof popupManaged.buildManagedPopup !== 'function' || typeof devtoolsManaged.buildManagedDevtools !== 'function') {
        return null;
    }

    return {
        buildManagedPopup: popupManaged.buildManagedPopup,
        buildManagedDevtools: devtoolsManaged.buildManagedDevtools,
    };
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

function copyExternalSurface(surface: 'popup' | 'devtools', config: UiSurfaceConfig, outputDir: string): string {
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

function loadHexaUi(cwd: string): HexaUiModule {
    const userRequire = createRequire(path.join(cwd, 'package.json'));

    let packageRoot: string | null = null;
    try {
        const packageJsonPath = userRequire.resolve('@hexajs-dev/ui/package.json');
        packageRoot = path.dirname(packageJsonPath);
    } catch {
        packageRoot = null;
    }

    if (packageRoot) {
        const distHelpers = tryLoadManagedUiHelpersFromDist(packageRoot, userRequire);
        if (distHelpers) {
            return distHelpers;
        }
    }

    try {
        return userRequire('@hexajs-dev/ui') as HexaUiModule;
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
    const hasManagedUi = (resolved.ui?.popup?.mode === 'managed') || (resolved.ui?.devtools?.mode === 'managed');
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

    const popupConfig = resolved.ui?.popup;
    const popupMode = popupConfig?.mode ?? 'none';
    const devtoolsConfig = resolved.ui?.devtools;
    const devtoolsMode = devtoolsConfig?.mode ?? 'none';

    const hexaUi = (popupMode === 'managed' || devtoolsMode === 'managed')
        ? loadHexaUi(process.cwd())
        : undefined;

    const shouldParallelizeManagedUi = resolved.ui?.parallelBuild !== false && !isWatchBuild;
    const canRunManagedUiInParallel = shouldParallelizeManagedUi && popupMode === 'managed' && devtoolsMode === 'managed';

    if (canRunManagedUiInParallel) {
        const { buildManagedPopup, buildManagedDevtools } = hexaUi!;
        const [popupEntry, devtoolsEntry] = await Promise.all([
            buildManagedPopup(popupConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken),
            buildManagedDevtools(devtoolsConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken),
        ]);
        entries.popup = popupEntry;
        entries.devtools = devtoolsEntry;
        return entries;
    }

    if (popupMode === 'managed') {
        const { buildManagedPopup } = hexaUi!;
        entries.popup = await buildManagedPopup(popupConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken);
    } else if (popupMode === 'external') {
        entries.popup = copyExternalSurface('popup', popupConfig!, outputDir);
    }

    if (devtoolsMode === 'managed') {
        const { buildManagedDevtools } = hexaUi!;
        entries.devtools = await buildManagedDevtools(devtoolsConfig, outputDir, resolved.compilerOptions, bootstrapPath, resolved.platform, watch, hmrAddress, hmrSessionToken);
    } else if (devtoolsMode === 'external') {
        entries.devtools = copyExternalSurface('devtools', devtoolsConfig!, outputDir);
    }

    return entries;
}

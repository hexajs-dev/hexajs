import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
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
    buildManagedPopup: (config: UiSurfaceConfig | undefined, outputDir: string, minify: boolean, bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string) => Promise<string>;
    buildManagedDevtools: (config: UiSurfaceConfig | undefined, outputDir: string, minify: boolean, bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string) => Promise<string>;
}

interface UiBootstrapBuildOutput {
    hasManagedUi: boolean;
    uiBootstrapContent?: string;
}

function runUiBuildCommand(surface: 'popup' | 'devtools', command: string): void {
    console.log(`→ Running ${surface} build command: ${command}`);
    execSync(command, {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: process.env.ComSpec ?? (process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'),
    });
}

function copyExternalSurface(surface: 'popup' | 'devtools', config: UiSurfaceConfig, outputDir: string): string {
    if (!config.distDir) throw new Error(`UI ${surface}: "distDir" is required for external mode.`);
    if (!config.indexFile) throw new Error(`UI ${surface}: "indexFile" is required for external mode.`);

    const sourceDist = path.resolve(process.cwd(), config.distDir);
    if (!fs.existsSync(sourceDist) || !fs.statSync(sourceDist).isDirectory()) {
        throw new Error(`UI ${surface} distDir does not exist or is not a directory: ${sourceDist}`);
    }
    const sourceIndex = path.join(sourceDist, config.indexFile);
    if (!fs.existsSync(sourceIndex)) {
        throw new Error(`UI ${surface} indexFile not found inside distDir: ${sourceIndex}`);
    }

    const targetBase = path.join(outputDir, 'ui', surface);
    fs.mkdirSync(targetBase, { recursive: true });
    fs.cpSync(sourceDist, targetBase, { recursive: true, force: true });

    return normalizeManifestPath(path.posix.join('ui', surface, config.indexFile.replace(/\\/g, '/')));
}

function loadHexaUi(cwd: string): HexaUiModule {
    const userRequire = createRequire(path.join(cwd, 'package.json'));
    try {
        return userRequire('@hexajs/ui') as HexaUiModule;
    } catch {
        const packageManager = detectProjectPM(cwd);
        throw new Error(
            `'@hexajs/ui' is not installed in your project but popup/devtools is set to managed mode.\n` +
            `Run: ${getAddDependencyCommand(packageManager, '@hexajs/ui')}\n` +
            `Or change the popup mode to "external" or "none" in hexa-cli.config.json.`
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

export async function buildUiEntries(resolved: ResolvedBuildConfig, outputDir: string, bootstrapPath: string, watch?: boolean, hmrAddress?: string): Promise<ManifestUiEntries> {
    const entries: ManifestUiEntries = {};

    const popupConfig = resolved.ui?.popup;
    const popupMode = popupConfig?.mode ?? 'none';
    if (popupMode === 'managed') {
        const { buildManagedPopup } = loadHexaUi(process.cwd());
        entries.popup = await buildManagedPopup(popupConfig, outputDir, resolved.compilerOptions.minify, bootstrapPath, resolved.platform, watch, hmrAddress);
    } else if (popupMode === 'external') {
        if (popupConfig?.buildCommand) runUiBuildCommand('popup', popupConfig.buildCommand);
        entries.popup = copyExternalSurface('popup', popupConfig!, outputDir);
    }

    const devtoolsConfig = resolved.ui?.devtools;
    const devtoolsMode = devtoolsConfig?.mode ?? 'none';
    if (devtoolsMode === 'managed') {
        const { buildManagedDevtools } = loadHexaUi(process.cwd());
        entries.devtools = await buildManagedDevtools(devtoolsConfig, outputDir, resolved.compilerOptions.minify, bootstrapPath, resolved.platform, watch, hmrAddress);
    } else if (devtoolsMode === 'external') {
        if (devtoolsConfig?.buildCommand) runUiBuildCommand('devtools', devtoolsConfig.buildCommand);
        entries.devtools = copyExternalSurface('devtools', devtoolsConfig!, outputDir);
    }

    return entries;
}

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ResolvedBuildConfig } from './bin/config/resolve';
import { ManifestGenerator, ManifestUiEntries } from './generators/manifest/generator';
import { ContentScriptOutput } from './generators/content/generator';
import { writeIconsArtifacts } from './generators/icons/generator';
import { copyStaticAssets } from './generators/assets/generator';
import { resolveUsedIconPath } from './generators/icons/paths';
import { bundleBootstrapFiles } from './bundler';
import { loadReactPlugin } from './bundler-react';
import { buildSourceContextMap, writeSourceContextMap } from './build/context-map.builder';
import { runBackgroundOrchestrator } from './build/background.orchestrator';
import { runContentOrchestrator } from './build/content.orchestrator';
import { persistDebugGeneratedArtifacts } from './build/debug-snapshot';
import { runFoundationOrchestrator } from './build/foundation.orchestrator';
import { UsedPortsCollector } from './build/used-ports.collector';
import { runUiOrchestrator } from './build/ui.orchestrator';
import { cleanupStoresForTarget, prepareOutputDirForTarget } from './build/output';
import { shouldRunStage, shouldWriteStoreForTarget } from './build/target-selection';
import { BuildActionOptions, BuildTarget, GeneratedArtifactRow } from './build/types';
import { minifyValidatorArtifacts } from './build/validator-minify';
import { withQuietLogs, writeGeneratedFile } from './build/runtime';
import { printGeneratedTable, printInfoLine, printWarningLine } from './shared/logging';
import { relativePathFromCwd } from './shared/path-utils';
import { detectProjectPM, getAddDependencyCommand } from './shared/package-manager';

export { prepareOutputDirForTarget } from './build/output';

function readExistingUiEntries(outputDir: string): ManifestUiEntries {
    const manifestPath = path.join(outputDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        return {};
    }

    try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(raw) as {
            action?: { default_popup?: string };
            devtools_page?: string;
        };

        const entries: ManifestUiEntries = {};
        if (manifest.action?.default_popup) {
            entries.popup = manifest.action.default_popup;
        }
        if (manifest.devtools_page) {
            entries.devtools = manifest.devtools_page;
        }
        return entries;
    } catch {
        return {};
    }
}

async function finalizeFullBuild(resolved: ResolvedBuildConfig, outputDir: string, contentBootstraps: ContentScriptOutput[], uiEntries: ManifestUiEntries, generatedRows: GeneratedArtifactRow[], watch?: boolean, hmrAddress?: string, hasOffscreenPage?: boolean, usedPorts: string[] = []): Promise<void> {
    await copyStaticAssets(resolved, outputDir);

    if (resolved.manifest) {
        const manifestSourcePath = path.resolve(process.cwd(), resolved.manifest);
        if (!fs.existsSync(manifestSourcePath)) {
            printWarningLine(`Manifest source not found (${relativePathFromCwd(manifestSourcePath)}). Using platform template.`);
        }
    }

    const manifestGenerator = new ManifestGenerator(contentBootstraps, resolved, uiEntries, { watch, hmrAddress, hasOffscreenPage, usedPorts });
    const manifestJson = await withQuietLogs(true, () => manifestGenerator.generate());
    const manifestPath = path.join(outputDir, 'manifest.json');
    generatedRows.push(writeGeneratedFile(manifestPath, manifestJson));

    const iconsExist = watch && fs.existsSync(path.join(outputDir, 'assets', 'icons', 'icon128.png'));
    if (!iconsExist) {
        await withQuietLogs(true, async () => writeIconsArtifacts(resolved, outputDir, uiEntries));
    }

    const iconSource = resolveUsedIconPath(resolved);
    if (iconSource.path) {
        const iconLabel = iconSource.fromFramework
            ? `Using framework fallback icon: ${relativePathFromCwd(iconSource.path)}`
            : `Using configured project icon: ${relativePathFromCwd(iconSource.path)}`;
        printInfoLine(iconLabel);
    } else {
        printWarningLine('No icon source resolved for this build.');
    }

    if (uiEntries.devtools) {
        const devtoolsHtmlPath = path.join(outputDir, ...uiEntries.devtools.split('/'));
        if (fs.existsSync(devtoolsHtmlPath)) {
            printInfoLine(`Wired devtools favicon: ${relativePathFromCwd(devtoolsHtmlPath)}`);
        }
    }
}

export async function buildAction(files: string[], resolved: ResolvedBuildConfig, options?: ts.CompilerOptions, buildOptions?: BuildActionOptions) {
    const verbose = !!buildOptions?.verbose;
    const target: BuildTarget = buildOptions?.target || 'all';
    const isUiWatchRebuild = !!buildOptions?.watch && target === 'ui';
    const generatedRows: GeneratedArtifactRow[] = [];
    const outputDir = path.join(process.cwd(), resolved.outDir);

    prepareOutputDirForTarget(outputDir, target);

    const foundation = runFoundationOrchestrator(files, resolved, options, verbose, target);
    foundation.rebuild = {...(foundation.rebuild ?? {}), ui: isUiWatchRebuild};
    foundation.watch = !!buildOptions?.watch;
    foundation.hmrAddress = buildOptions?.hmrAddress;
    foundation.hmrSessionToken = buildOptions?.hmrSessionToken;
    const { storeOutputs, program, registry } = foundation;
    const usedPorts = new UsedPortsCollector(registry).collect();

    storeOutputs
        .filter(store => shouldWriteStoreForTarget(target, store.context))
        .forEach((storeOutput) => {
            const contextFolder = storeOutput.context.toLowerCase();
            const storePath = path.join(outputDir, contextFolder, `${contextFolder}.store.js`);
            generatedRows.push(writeGeneratedFile(storePath, storeOutput.content));
        });

    let uiEntries: ManifestUiEntries = {};
    let contentBootstraps: ContentScriptOutput[] = [];
    let backgroundBundleEntries: string[] = [];
    let contentBundleEntries: string[] = [];
    let workerBundleEntries: string[] = [];
    const validatorArtifactPaths: string[] = [];
    let hasOffscreenPage = false;
    let backgroundBootstrap = '';

    if (shouldRunStage(target, 'ui')) {
        const uiResult = await runUiOrchestrator(foundation);
        uiEntries = uiResult.uiEntries;
        generatedRows.push(...uiResult.generatedRows);
        persistDebugGeneratedArtifacts(resolved, outputDir, uiResult.generatedRows, 'ui');

        const popupMode = resolved.ui?.popup?.mode ?? 'none';
        if (!isUiWatchRebuild && popupMode !== 'none' && uiEntries.popup) {
            const popupTarget = path.join(outputDir, path.dirname(uiEntries.popup));
            const popupLabel = popupMode === 'managed' ? 'Built managed popup UI' : 'Copied external popup UI';
            printInfoLine(`${popupLabel}: ${relativePathFromCwd(popupTarget)}`);
        }

        const devtoolsMode = resolved.ui?.devtools?.mode ?? 'none';
        if (!isUiWatchRebuild) {
            printInfoLine(`Devtools mode: ${devtoolsMode}`);
        }
        if (!isUiWatchRebuild && devtoolsMode !== 'none' && uiEntries.devtools) {
            const devtoolsTarget = path.join(outputDir, path.dirname(uiEntries.devtools));
            const devtoolsLabel = devtoolsMode === 'managed' ? 'Built managed devtools UI' : 'Copied external devtools UI';
            printInfoLine(`${devtoolsLabel}: ${relativePathFromCwd(devtoolsTarget)}`);
        }
    }

    if (shouldRunStage(target, 'content')) {
        const contentResult = runContentOrchestrator(foundation);
        contentBootstraps = contentResult.contentBootstraps;
        contentBundleEntries = contentResult.contentBundleEntries;
        validatorArtifactPaths.push(contentResult.contentValidatorPath);
        generatedRows.push(...contentResult.generatedRows);
        persistDebugGeneratedArtifacts(resolved, outputDir, contentResult.generatedRows, 'content');
    }

    if (shouldRunStage(target, 'background')) {
        const backgroundResult = runBackgroundOrchestrator(foundation);
        backgroundBootstrap = backgroundResult.backgroundBootstrap;
        backgroundBundleEntries = backgroundResult.backgroundBundleEntries;
        validatorArtifactPaths.push(backgroundResult.backgroundValidatorPath);
        workerBundleEntries = backgroundResult.workerBundleEntries;
        hasOffscreenPage = backgroundResult.hasOffscreenPage;
        generatedRows.push(...backgroundResult.generatedRows);
        persistDebugGeneratedArtifacts(resolved, outputDir, backgroundResult.generatedRows, 'background');
    }

    const contextMap = buildSourceContextMap(program, registry);
    writeSourceContextMap(contextMap);

    if (target === 'content' && !shouldRunStage(target, 'ui')) {
        uiEntries = readExistingUiEntries(outputDir);
    }

    if (target === 'all' || (target === 'content' && !!buildOptions?.watch)) {
        await finalizeFullBuild(resolved, outputDir, contentBootstraps, uiEntries, generatedRows, buildOptions?.watch, buildOptions?.hmrAddress, hasOffscreenPage, usedPorts);
    }

    if (backgroundBundleEntries.length > 0) {
        await bundleBootstrapFiles({
            outputDir,
            entryPoints: backgroundBundleEntries,
            minify: resolved.compilerOptions.minify,
            sourceMap: resolved.compilerOptions.sourceMap,
            cssMinify: resolved.compilerOptions.cssMinify,
            terserOptions: resolved.compilerOptions.terserOptions,
            projectRoot: process.cwd(),
            platform: resolved.platform,
            context: 'background',
            tsConfigPath: resolved.tsConfig,
        });
    }

    if (contentBundleEntries.length > 0) {
        const contentPlugins: import('vite').Plugin[] = [];
        const hasViews = registry.getViews().length > 0;
        if (hasViews) {
            const reactPlugin = loadReactPlugin(process.cwd());
            if (!reactPlugin) {
                const packageManager = detectProjectPM(process.cwd());
                printWarningLine(`@View detected but @vitejs/plugin-react is not installed. Run: ${getAddDependencyCommand(packageManager, '@vitejs/plugin-react', true)}`);
            } else {
                const plugins = Array.isArray(reactPlugin) ? reactPlugin : [reactPlugin];
                contentPlugins.push(...plugins);
            }
        }
        await bundleBootstrapFiles({
            outputDir,
            entryPoints: contentBundleEntries,
            minify: resolved.compilerOptions.minify,
            sourceMap: resolved.compilerOptions.sourceMap,
            cssMinify: resolved.compilerOptions.cssMinify,
            terserOptions: resolved.compilerOptions.terserOptions,
            projectRoot: process.cwd(),
            platform: resolved.platform,
            context: 'content',
            tsConfigPath: resolved.tsConfig,
            plugins: contentPlugins,
        });
    }

    if (workerBundleEntries.length > 0) {
        await bundleBootstrapFiles({
            outputDir,
            entryPoints: workerBundleEntries,
            minify: resolved.compilerOptions.minify,
            sourceMap: resolved.compilerOptions.sourceMap,
            cssMinify: resolved.compilerOptions.cssMinify,
            terserOptions: resolved.compilerOptions.terserOptions,
            projectRoot: process.cwd(),
            platform: resolved.platform,
            context: 'worker',
            tsConfigPath: resolved.tsConfig,
        });
    }

    await minifyValidatorArtifacts({ outputDir, validatorArtifactPaths, resolved });

    cleanupStoresForTarget(outputDir, storeOutputs.map(s => s.context), target);

    printGeneratedTable(generatedRows);

    return {
        backgroundBootstrap,
        contentBootstraps,
        storeOutputs,
        registry,
    };
}


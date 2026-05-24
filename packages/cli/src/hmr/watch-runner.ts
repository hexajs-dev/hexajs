import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { ResolvedBuildConfig } from '../bin/config/resolve';
import { WatchRunnerCallbacks } from '../build/types';
import { readSourceContextMap } from '../build/context-map.builder';
import { resolveHMRServerAddress, UIHMRServer } from './ui-hmr-server';
import { BackgroundPatchServer, DEFAULT_PATCH_SERVER_HOST, DEFAULT_PATCH_SERVER_PORT } from './background-patch-server';
import { ChromiumCdpInjector } from './chromium-cdp-injector';
import { resolveManagedUiWatchTargets, startManagedUiWatcher } from './ui-watch';
import { analyzeChangedFile, getDecoratorFallbackContexts } from './rebuild-decision';
import { printInfoLine, printWarningLine } from '../shared/logging';

export interface WatchRunnerOptions extends WatchRunnerCallbacks {
    resolved: ResolvedBuildConfig;
    files: string[];
    compilerOptions?: ts.CompilerOptions;
    verbose: boolean;
}

function stripInlineSourceMap(code: string): string {
    return code.replace(/\n\/\/# sourceMappingURL=.*$/s, '');
}

function parseVendorExportBlock(code: string): { stripped: string; exportMap: Record<string, string> } | null {
    const match = code.match(/\nexport\s*\{([\s\S]*?)\};?\s*$/);
    if (!match) return null;

    const exportMap: Record<string, string> = {};
    const entries = match[1].split(',').map(e => e.trim()).filter(Boolean);
    for (const entry of entries) {
        const asMatch = entry.match(/^(\S+)\s+as\s+(\S+)$/);
        if (asMatch) {
            exportMap[asMatch[2]] = asMatch[1];
        } else {
            exportMap[entry] = entry;
        }
    }

    const stripped = code.slice(0, match.index! + 1);
    return { stripped, exportMap };
}

function buildVendorGlobalAssignment(exportMap: Record<string, string>): string {
    const entries = Object.entries(exportMap)
        .map(([exported, internal]) => exported === internal ? exported : `${exported}: ${internal}`)
        .join(', ');
    return `globalThis.__HEXA_V__ = { ${entries} };`;
}

function replaceBootstrapImportWithDestructure(code: string): string {
    return code.replace(
        /^import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"];\s*/m,
        (_, specs: string) => {
            const destructured = specs.replace(/\s+as\s+/g, ': ');
            return `const {${destructured.trim()} } = globalThis.__HEXA_V__;\ndelete globalThis.__HEXA_V__;\n`;
        },
    );
}

function buildChromiumBackgroundPatchPayload(outputDir: string): string {
    const vendorPath = path.join(outputDir, 'background', 'hexa-vendor-background.js');
    const bootstrapPath = path.join(outputDir, 'background', 'background.bootstrap.js');

    if (!fs.existsSync(vendorPath)) {
        throw new Error(`Chromium vendor chunk not found: ${vendorPath}`);
    }

    if (!fs.existsSync(bootstrapPath)) {
        throw new Error(`Chromium background bootstrap not found: ${bootstrapPath}`);
    }

    const vendorRaw = stripInlineSourceMap(fs.readFileSync(vendorPath, 'utf-8'));
    const parsed = parseVendorExportBlock(vendorRaw);
    if (!parsed) {
        throw new Error('Could not parse vendor export block in background/hexa-vendor-background.js');
    }

    const vendorCode = parsed.stripped.trim();
    const globalAssignment = buildVendorGlobalAssignment(parsed.exportMap);

    const bootstrapRaw = stripInlineSourceMap(fs.readFileSync(bootstrapPath, 'utf-8'));
    const bootstrapCode = replaceBootstrapImportWithDestructure(bootstrapRaw).trim();

    return `(() => {\n(() => {\n${vendorCode}\n${globalAssignment}\n})();\n${bootstrapCode}\n})();`;
}

export async function runWatchMode(options: WatchRunnerOptions): Promise<void> {
    const uiTargets = resolveManagedUiWatchTargets(options.resolved);
    if (uiTargets.length === 0) {
        throw new Error('Watch mode requires at least one managed UI surface (popup/devtools).');
    }

    const hmrPortValue = process.env.HEXA_HMR_PORT;
    const parsedPort = hmrPortValue ? Number(hmrPortValue) : undefined;
    const hmrConfig = resolveHMRServerAddress({
        host: process.env.HEXA_HMR_HOST,
        port: Number.isFinite(parsedPort) ? parsedPort : undefined,
    });

    const hmrServer = new UIHMRServer({ host: hmrConfig.host, port: hmrConfig.port });
    const hmrAddress = await hmrServer.start();
    printInfoLine(`HMR server started at ${hmrAddress.url}`);

    const patchServer = new BackgroundPatchServer({
        host: process.env.HEXA_PATCH_HOST ?? DEFAULT_PATCH_SERVER_HOST,
        port: Number.isFinite(Number(process.env.HEXA_PATCH_PORT))
            ? Number(process.env.HEXA_PATCH_PORT)
            : DEFAULT_PATCH_SERVER_PORT,
        rootDir: path.join(process.cwd(), options.resolved.outDir),
    });
    const patchAddress = await patchServer.start();
    printInfoLine(`Patch server started at ${patchAddress.url}`);

    const chromiumInjector = new ChromiumCdpInjector();
    let hasShownChromiumCdpHelp = false;

    // Load context map once at initialization
    const contextMap = readSourceContextMap();

    // Track latest content script outputs for re-injection when background restarts
    let latestContentPatches: { filename: string; matches: string[]; allFrames: boolean }[] = [];

    const initialContentBootstraps = await options.onInitialBuild(hmrAddress.url, hmrAddress.sessionToken);
    if (initialContentBootstraps && initialContentBootstraps.length > 0) {
        latestContentPatches = initialContentBootstraps.map(cs => ({
            filename: `content/${cs.name}.js`,
            matches: cs.matches,
            allFrames: cs.allFrames ?? false,
        }));
    }

    const publishBackgroundReload = async (reason: string): Promise<void> => {
        const platform = options.resolved.platform;
        switch (platform) {
            case 'firefox': {
                const patchUrl = `${patchServer.buildPatchUrl('background/background.bootstrap.js')}?t=${Date.now()}`;
                hmrServer.publish({
                    type: 'FIREFOX_HMR_PATCH',
                    patchUrl,
                    reason,
                    timestamp: Date.now(),
                });
                hmrServer.publishBackgroundReload({
                    strategy: 'firefox-patch',
                    patchUrl,
                    reason,
                    platform,
                });
                printInfoLine(`Published Firefox background patch: ${patchUrl}`);
                return;
            }
            case 'safari': {
                hmrServer.publishBackgroundReload({
                    strategy: 'safari-reload',
                    reason,
                    platform,
                });
                printInfoLine('Published Safari background reload event');
                return;
            }
            case 'chrome':
            case 'edge':
            case 'opera':
            case 'brave': {
                try {
                    const chromiumPayload = buildChromiumBackgroundPatchPayload(path.join(process.cwd(), options.resolved.outDir));
                    printInfoLine('Attempting to inject background patch via Chromium CDP...');
                    await chromiumInjector.injectScript(chromiumPayload);
                    hmrServer.publishBackgroundReload({
                        strategy: 'chromium-cdp',
                        reason,
                        platform,
                    });
                    printInfoLine('Injected Chromium background patch via CDP');
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    printWarningLine(`Chromium CDP injection failed: ${message}`);
                    if (!hasShownChromiumCdpHelp) {
                        printInfoLine('To enable Chromium background HMR: launch Chromium with --remote-debugging-port=9222 and set HEXA_CHROMIUM_DEBUG_ENDPOINT if needed.');
                        hasShownChromiumCdpHelp = true;
                    }
                    hmrServer.publishBackgroundReload({
                        strategy: 'chromium-runtime-reload',
                        reason,
                        platform,
                    });
                    printInfoLine('Falling back to Chromium runtime reload for background changes');
                }
                return;
            }
            default:
                return;
        }
    };

    const watchers: fs.FSWatcher[] = [];
    const debounced = new Map<string, NodeJS.Timeout>();

    // Watch managed UI surfaces
    for (const target of uiTargets) {
        if (!fs.existsSync(target.sourceDir) || !fs.statSync(target.sourceDir).isDirectory()) {
            printWarningLine(`Skipping missing managed UI source: ${target.sourceDir}`);
            continue;
        }

        const watcher = startManagedUiWatcher(target.sourceDir, (absolutePath) => {
            const key = `${target.surface}:${absolutePath}`;
            const existing = debounced.get(key);
            if (existing) {
                clearTimeout(existing);
            }

            const timeout = setTimeout(async () => {
                const changedPath = path.relative(process.cwd(), absolutePath).replace(/\\/g, '/');
                try {
                    // Determine which contexts are affected by this file change
                    let affectedContexts = analyzeChangedFile(changedPath, contextMap);
                    
                    // If file not in map, check decorator-based fallback
                    if (affectedContexts.length === 0) {
                        affectedContexts = await getDecoratorFallbackContexts(changedPath);
                    }

                    // If still no contexts found, default to UI rebuild for managed UI surfaces
                    if (affectedContexts.length === 0) {
                        affectedContexts = ['ui'];
                    }

                    // Invoke rebuild callbacks for affected contexts in parallel
                    const rebuildPromises: Promise<void>[] = [];
                    let contentBootstraps: any[] | undefined;
                    
                    if (affectedContexts.includes('ui')) {
                        rebuildPromises.push(options.onUiRebuild(hmrAddress.url, hmrAddress.sessionToken));
                    }
                    if (affectedContexts.includes('background') && options.onBackgroundRebuild) {
                        rebuildPromises.push(options.onBackgroundRebuild(hmrAddress.url, hmrAddress.sessionToken));
                    }
                    if (affectedContexts.includes('content') && options.onContentRebuild) {
                        rebuildPromises.push(
                            options.onContentRebuild(hmrAddress.url, hmrAddress.sessionToken).then(outputs => {
                                contentBootstraps = outputs;
                            })
                        );
                    }

                    await Promise.all(rebuildPromises);

                    if (affectedContexts.includes('background') && options.onBackgroundRebuild) {
                        // Queue content re-injection before publishing reload to avoid missing fast acks.
                        if (latestContentPatches.length > 0) {
                            hmrServer.setPendingContentPatches(latestContentPatches);
                        }
                        await publishBackgroundReload(`Background updated (${changedPath})`);
                    }

                    // Publish content reload event if content was rebuilt
                    if (contentBootstraps && contentBootstraps.length > 0) {
                        const patches = contentBootstraps.map(cs => ({
                            filename: `content/${cs.name}.js`,
                            matches: cs.matches,
                            allFrames: cs.allFrames ?? false,
                        }));
                        latestContentPatches = patches;
                        hmrServer.publishContentReload(patches);
                        printInfoLine(`Published content reload event for ${patches.length} patch(es)`);
                    }

                    if (changedPath.endsWith('.html')) {
                        hmrServer.publishReload(target.surface, `HTML entry updated (${changedPath})`);
                        printInfoLine(`Published UI reload event for ${target.surface}: ${changedPath}`);
                    } else {
                        hmrServer.publishUpdate(target.surface, changedPath);
                        printInfoLine(`Published UI update event for ${target.surface}: ${changedPath}`);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    hmrServer.publishBuildError(message);
                    printWarningLine(`UI rebuild failed: ${message}`);
                } finally {
                    debounced.delete(key);
                }
            }, 120);

            debounced.set(key, timeout);
        });

        watchers.push(watcher);
    }

    // Watch general source files for content/background changes
    const srcDir = path.resolve(process.cwd(), 'src');
    if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
        const srcWatcher = fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
            if (!filename) return;

            const absolutePath = path.resolve(srcDir, filename);
            const ext = path.extname(filename).toLowerCase();
            const watchableExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue']);
            
            if (!watchableExts.has(ext)) {
                return;
            }

            const key = `src:${absolutePath}`;
            const existing = debounced.get(key);
            if (existing) {
                clearTimeout(existing);
            }

            const timeout = setTimeout(async () => {
                const changedPath = path.relative(process.cwd(), absolutePath).replace(/\\/g, '/');
                try {
                    // Determine which contexts are affected by this file change
                    let affectedContexts = analyzeChangedFile(changedPath, contextMap);
                    
                    // If file not in map, check decorator-based fallback
                    if (affectedContexts.length === 0) {
                        affectedContexts = await getDecoratorFallbackContexts(changedPath);
                    }

                    // .vue files under src/ are always @View components (content context).
                    // They are never in the TS context map because the TypeScript compiler
                    // does not parse SFCs, so we must default them to content.
                    if (affectedContexts.length === 0 && changedPath.endsWith('.vue')) {
                        affectedContexts = ['content'];
                    }

                    // Invoke rebuild callbacks for affected contexts
                    const rebuildPromises: Promise<void>[] = [];
                    let contentBootstraps: any[] | undefined;
                    
                    if (affectedContexts.includes('background') && options.onBackgroundRebuild) {
                        rebuildPromises.push(options.onBackgroundRebuild(hmrAddress.url, hmrAddress.sessionToken));
                    }
                    if (affectedContexts.includes('content') && options.onContentRebuild) {
                        rebuildPromises.push(
                            options.onContentRebuild(hmrAddress.url, hmrAddress.sessionToken).then(outputs => {
                                contentBootstraps = outputs;
                            })
                        );
                    }

                    if (rebuildPromises.length > 0) {
                        await Promise.all(rebuildPromises);

                        if (affectedContexts.includes('background') && options.onBackgroundRebuild) {
                            // Queue content re-injection before publishing reload to avoid missing fast acks.
                            if (latestContentPatches.length > 0) {
                                hmrServer.setPendingContentPatches(latestContentPatches);
                            }
                            await publishBackgroundReload(`Background updated (${changedPath})`);
                        }

                        // Publish content reload event if content was rebuilt
                        if (contentBootstraps && contentBootstraps.length > 0) {
                            const patches = contentBootstraps.map(cs => ({
                                filename: `content/${cs.name}.js`,
                                matches: cs.matches,
                                allFrames: cs.allFrames ?? false,
                            }));
                            latestContentPatches = patches;
                            hmrServer.publishContentReload(patches);
                            printInfoLine(`Published content reload event for ${patches.length} patch(es): ${changedPath}`);
                        }
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    hmrServer.publishBuildError(message);
                    printWarningLine(`Content/Background rebuild failed: ${message}`);
                } finally {
                    debounced.delete(key);
                }
            }, 120);

            debounced.set(key, timeout);
        });

        watchers.push(srcWatcher);
    }

    let cleanupPromise: Promise<void> | undefined;

    const cleanup = async () => {
        if (cleanupPromise) {
            return cleanupPromise;
        }

        cleanupPromise = (async () => {
            process.off('SIGINT', onSignal);
            process.off('SIGTERM', onSignal);
            process.off('SIGHUP', onSignal);
            process.off('uncaughtException', onUncaughtException);
            process.off('unhandledRejection', onUnhandledRejection);

            debounced.forEach((timeout) => clearTimeout(timeout));
            debounced.clear();
            watchers.forEach((watcher) => watcher.close());
            await hmrServer.close();
            await patchServer.close();
        })();

        return cleanupPromise;
    };

    const onSignal = () => {
        void cleanup().finally(() => process.exit(0));
    };

    const onUncaughtException = (error: Error) => {
        printWarningLine(`Uncaught exception during watch: ${error.message}`);
        void cleanup().catch(() => undefined).finally(() => process.exit(1));
    };

    const onUnhandledRejection = (reason: unknown) => {
        const message = reason instanceof Error ? reason.message : String(reason);
        printWarningLine(`Unhandled rejection during watch: ${message}`);
        void cleanup().catch(() => undefined).finally(() => process.exit(1));
    };

    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
    process.on('SIGHUP', onSignal);
    process.on('uncaughtException', onUncaughtException);
    process.on('unhandledRejection', onUnhandledRejection);

    await new Promise<void>(() => undefined);
}

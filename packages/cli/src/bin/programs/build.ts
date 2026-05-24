import { Command } from "commander";
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import { buildAction } from '../../index';
import ts from 'typescript';
import { loadHexaConfig } from "../config/config";
import { resolveConfig } from "../config/resolve";
import { printHeader, printSuccess, printError, startStep } from "../shared/reporter";
import { runWatchMode } from '../../hmr/watch-runner';
import { isAutoLaunchSupportedPlatform, installFirefoxAddonOverRDP, launchBrowserWithExtension } from '../../shared/chrome-launcher';
import { printInfoLine, printWarningLine } from '../../shared/logging';
import cliPackage from '../../../package.json';

const CLI_VERSION = `v${cliPackage.version}`;
const CONFIG_FILENAMES = ['hexa-cli.config.json', 'hexa-cli.json'];
const BUILD_TARGETS = ['all', 'ui', 'content', 'background'] as const;
type BuildTarget = typeof BUILD_TARGETS[number];

async function ensureHexaProject(cwd: string): Promise<void> {
    const configPath = await findConfigPath(cwd);
    if (!configPath) {
        throw new Error('The current directory is not a HexaJS extension project.');
    }

    try {
        await fs.readJson(configPath);
    } catch {
        throw new Error(`Invalid Hexa config file: ${path.basename(configPath)}.`);
    }
}

async function findConfigPath(cwd: string): Promise<string | null> {
    for (const fileName of CONFIG_FILENAMES) {
        const fullPath = path.join(cwd, fileName);
        if (await fs.pathExists(fullPath)) {
            return fullPath;
        }
    }
    return null;
}

function normalizeTarget(input: string | undefined): BuildTarget {
    const value = (input || 'all').toLowerCase();
    if ((BUILD_TARGETS as readonly string[]).includes(value)) {
        return value as BuildTarget;
    }
    throw new Error(`Invalid build target "${input}". Allowed values: ${BUILD_TARGETS.join(', ')}.`);
}

function getPlatformLabel(platform: string): string {
    if (platform === 'chrome') return 'Chrome';
    if (platform === 'edge') return 'Edge';
    if (platform === 'firefox') return 'Firefox';
    if (platform === 'opera') return 'Opera';
    if (platform === 'brave') return 'Brave';
    return platform;
}

export const build = (program: Command) => {
program
    .command('build')
    .description('Compile the extension and generate HexaJS boilerplate')
    .option('--platform <name>', 'Target platform (chrome, firefox, safari, opera, edge, brave)', 'chrome')
    .option('--mode <name>', 'Build mode (e.g. development, production)')
    .option('--target <type>', 'Build target (all, ui, content, background)', 'all')
    .option('--verbose', 'Print additional generated file details', false)
    .option('--watch', 'Watch for changes', false)
    .option('--no-auto-open-browser', 'Disable automatic Chrome launch in watch mode')
    .action(async (options) => {
        const buildStart = Date.now();

        try {
            await ensureHexaProject(process.cwd());

            // 1. Load configuration from file
            const initDone = startStep('Initializing build environment');
            const fileConfig = await loadHexaConfig();

            // 2. Validate and select platform + mode
            const platformName = options.platform || fileConfig.defaultPlatform || 'chrome';
            const mode = options.mode || fileConfig.defaultMode || 'production';

            // 3. Resolve config (merges environment + platform overrides)
            const resolved = resolveConfig(fileConfig, platformName, mode);
            const target = normalizeTarget(options.target);
            const watchMode = !!options.watch;
            const autoLaunchPlatform = isAutoLaunchSupportedPlatform(resolved.platform) ? resolved.platform : null;
            const shouldAutoOpenBrowser = watchMode && !!autoLaunchPlatform && options.autoOpenBrowser !== false;
            let hasAttemptedBrowserAutoOpen = false;

            function buildDoneMessage(target: BuildTarget, resolvedConfig: any): string {
                const managedUiParts: string[] = [];
                if (resolvedConfig.ui?.popup?.mode === 'managed') managedUiParts.push('Popup');
                if (resolvedConfig.ui?.devtools?.mode === 'managed') managedUiParts.push('Devtools');
                const managedSuffix = managedUiParts.length ? ` & Managed ${managedUiParts.join(' and ')}` : '';
                return target === 'all' ? `Store, Background, Content & Manifest generated${managedSuffix}` : `Target build generated (${target})`;
            }

            if (watchMode && target !== 'all') {
                throw new Error('Watch mode only supports full builds. Remove --target when using --watch.');
            }

            const hasManagedUi = (resolved.ui?.popup?.mode === 'managed') || (resolved.ui?.devtools?.mode === 'managed');
            if (watchMode && !hasManagedUi) {
                throw new Error('Watch mode currently supports managed UI only. Configure popup/devtools mode as "managed" or run without --watch.');
            }

            printHeader(CLI_VERSION, fileConfig.project.name, platformName, mode);
            initDone();

            // 4. Resolve tsconfig — from resolved config
            const tsDone = startStep('Loading TypeScript configuration');
            const configPath = path.resolve(process.cwd(), resolved.tsConfig);
            const examplePath = path.dirname(configPath);

            const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
            const parsedConfig = ts.parseJsonConfigFileContent(
                configFile.config,
                ts.sys,
                examplePath
            );
            tsDone(`${parsedConfig.fileNames.length} files found`);

            if (watchMode) {
                const watchDone = startStep('Starting watch mode');
                watchDone('Managed UI HMR enabled');

                await runWatchMode({
                    resolved,
                    files: parsedConfig.fileNames,
                    compilerOptions: parsedConfig.options,
                    verbose: !!options.verbose,
                    onInitialBuild: async (hmrAddress: string, hmrSessionToken: string) => {
                        const buildDone = startStep('Building HexaJS Pipeline');
                        const result = await buildAction(parsedConfig.fileNames, resolved, parsedConfig.options, {
                            verbose: options.verbose,
                            target,
                            watch: true,
                            hmrAddress,
                            hmrSessionToken,
                        });
                        buildDone(buildDoneMessage(target, resolved));

                        if (shouldAutoOpenBrowser && autoLaunchPlatform && !hasAttemptedBrowserAutoOpen) {
                            hasAttemptedBrowserAutoOpen = true;
                            try {
                                const launch = launchBrowserWithExtension({
                                    platform: autoLaunchPlatform,
                                    extensionDir: path.join(process.cwd(), resolved.outDir),
                                });
                                const browserLabel = getPlatformLabel(autoLaunchPlatform);
                                printInfoLine(`${browserLabel} launched for watch mode: ${launch.executablePath}`);
                                printInfoLine(`Using extension output: ${launch.extensionDir}`);
                                if (launch.debugPort) {
                                    printInfoLine(`Chromium debug endpoint: http://127.0.0.1:${launch.debugPort}`);
                                }
                                if (launch.extensionId) {
                                    printInfoLine(`Pinned extension action for this dev profile: ${launch.extensionId}`);
                                }
                                // Debug logging for launch arguments
                                printInfoLine(`Launch arguments: ${launch.args.join(' ')}`);
                                if (autoLaunchPlatform === 'firefox') {
                                    printInfoLine(`Firefox opened with an isolated profile at: ${launch.userDataDir}`);
                                    if (launch.debugPort) {
                                        printInfoLine(`Firefox remote debugger: 127.0.0.1:${launch.debugPort}`);
                                    }
                                    if (launch.debugPort) {
                                        installFirefoxAddonOverRDP({
                                            extensionDir: launch.extensionDir,
                                            port: launch.debugPort,
                                        }).then(result => {
                                            printInfoLine(`Firefox extension installed as temporary add-on: ${result.addonId}`);
                                        }).catch((installError: unknown) => {
                                            const installMessage = installError instanceof Error ? installError.message : String(installError);
                                            printWarningLine(`Firefox extension auto-install failed: ${installMessage}`);
                                            printInfoLine(`Open about:debugging in Firefox and load the manifest manually from: ${launch.extensionDir}`);
                                        });
                                    }
                                } else {
                                    printInfoLine('If the extension is not visible, enable Developer mode on the extensions page and reload once.');
                                }
                            } catch (error) {
                                const message = error instanceof Error ? error.message : String(error);
                                printWarningLine(`Browser auto-launch skipped: ${message}`);
                                printInfoLine('Continue development without auto-launch by passing --no-auto-open-browser.');
                            }
                        }

                        return result.contentBootstraps;
                    },
                    onUiRebuild: async (hmrAddress: string, hmrSessionToken: string) => {
                        await buildAction(parsedConfig.fileNames, resolved, parsedConfig.options, {
                            verbose: false,
                            target: 'ui',
                            watch: true,
                            hmrAddress,
                            hmrSessionToken,
                        });
                    },
                    onBackgroundRebuild: async (hmrAddress: string, hmrSessionToken: string) => {
                        // Background rebuild implementation staged for future phases
                        await buildAction(parsedConfig.fileNames, resolved, parsedConfig.options, {
                            verbose: false,
                            target: 'background',
                            watch: true,
                            hmrAddress,
                            hmrSessionToken,
                        });
                    },
                    onContentRebuild: async (hmrAddress: string, hmrSessionToken: string) => {
                        const result = await buildAction(parsedConfig.fileNames, resolved, parsedConfig.options, {
                            verbose: false,
                            target: 'content',
                            watch: true,
                            hmrAddress,
                            hmrSessionToken,
                        });
                        return result.contentBootstraps;
                    },
                });
                return;
            }

            // 5. Run the Build Pipeline
            const buildDone = startStep('Building HexaJS Pipeline');
            await buildAction(parsedConfig.fileNames, resolved, parsedConfig.options, { verbose: options.verbose, target, watch: false });
            buildDone(buildDoneMessage(target, resolved));

            printSuccess(Date.now() - buildStart, resolved.outDir);

        } catch (error) {
            printError(error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
}
import * as ts from 'typescript';
import * as path from 'path';
import { buildAction } from '.';
import { loadHexaConfig } from './bin/config/config';
import { resolveConfig } from './bin/config/resolve';
import { printHeader, printSuccess, printError, startStep } from './bin/shared/reporter';

const CLI_VERSION = 'v0.0.0';

// ── Target: examples/generated ───────────────────────────────────────────────
// Change PLATFORM / MODE to debug a different target.
const PLATFORM = 'chrome';
const MODE = 'development';
const PROJECT_ROOT = path.resolve(__dirname, '../../../examples/clip-volt');

async function debugBuild(): Promise<void> {
    const buildStart = Date.now();

    // Override cwd so loadHexaConfig finds the right hexa-cli.config.json
    process.chdir(PROJECT_ROOT);

    try {
        // 1. Load hexa config (same as `hexa build`)
        const initDone = startStep('Initializing build environment');
        const fileConfig = await loadHexaConfig();

        // 2. Resolve platform + mode
        const platformName = PLATFORM || fileConfig.defaultPlatform || 'chrome';
        const mode = MODE || fileConfig.defaultMode || 'production';
        const resolved = resolveConfig(fileConfig, platformName, mode);
        resolved.debug = true; // Set debug flag for conditional logic in generators, etc.

        printHeader(CLI_VERSION, fileConfig.project.name, platformName, mode);
        initDone();

        // 3. Load tsconfig — from resolved config
        const tsDone = startStep('Loading TypeScript configuration');
        const configPath = path.resolve(PROJECT_ROOT, resolved.tsConfig);

        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        const parsedConfig = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            path.dirname(configPath)
        );
        tsDone(`${parsedConfig.fileNames.length} files found`);

        // 4. Run build pipeline
        const buildDone = startStep('Building HexaJS Pipeline');
        await buildAction(parsedConfig.fileNames, resolved, parsedConfig.options, { verbose: true });
        buildDone('Store, Background, Content & Manifest generated');

        printSuccess(Date.now() - buildStart, resolved.outDir);

    } catch (error) {
        printError(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

debugBuild();
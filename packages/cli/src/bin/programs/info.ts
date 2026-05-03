import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectProjectPM, getPackageManagerVersion } from '../../shared/package-manager';
import { printError } from '../shared/reporter';
import cliPackage from '../../../package.json';

interface ProjectPackageJson {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
}

function resolvePlatformName(platform: NodeJS.Platform): string {
    switch (platform) {
        case 'darwin':
            return 'macOS';
        case 'win32':
            return 'Windows';
        case 'linux':
            return 'Linux';
        default:
            return platform;
    }
}

function collectLocalHexaPackages(cwd: string): string[] {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return [];
    }

    let packageJson: ProjectPackageJson;
    try {
        const raw = fs.readFileSync(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(raw) as ProjectPackageJson;
    } catch {
        return [];
    }

    const packageNames = new Set<string>();
    const dependencyGroups = [
        packageJson.dependencies,
        packageJson.devDependencies,
        packageJson.peerDependencies,
        packageJson.optionalDependencies,
    ];

    for (const group of dependencyGroups) {
        if (!group) {
            continue;
        }
        for (const packageName of Object.keys(group)) {
            if (packageName.startsWith('@hexajs-dev/') && packageName !== '@hexajs-dev/cli') {
                packageNames.add(packageName);
            }
        }
    }

    return Array.from(packageNames).sort((left, right) => left.localeCompare(right));
}

function resolveLocalPackageVersion(cwd: string, packageName: string): string {
    try {
        const resolvedPackageJsonPath = require.resolve(`${packageName}/package.json`, { paths: [cwd] });
        const raw = fs.readFileSync(resolvedPackageJsonPath, 'utf-8');
        const parsed = JSON.parse(raw) as { version?: string };
        return parsed.version || 'unknown';
    } catch {
        return 'unknown';
    }
}

export const infoCommand = (program: Command): void => {
    program
        .command('info')
        .description('Display HexaJS environment information')
        .action(() => {
            try {
                const cwd = process.cwd();
                const packageManager = detectProjectPM(cwd);
                const packageManagerVersion = getPackageManagerVersion(packageManager);
                const localHexaPackages = collectLocalHexaPackages(cwd);

                console.log(`System: ${resolvePlatformName(process.platform)} ${os.release()} (${process.arch})`);
                console.log(`Node: ${process.version}`);
                console.log(`Package Manager: ${packageManager} ${packageManagerVersion}`);
                console.log('');
                console.log('HexaJS Environment:');
                console.log(`@hexajs-dev/cli: ${cliPackage.version} (global)`);

                if (localHexaPackages.length === 0) {
                    console.log('No local @hexajs-dev/* packages detected.');
                    return;
                }

                for (const packageName of localHexaPackages) {
                    const version = resolveLocalPackageVersion(cwd, packageName);
                    console.log(`${packageName}: ${version} (local)`);
                }
            } catch (error) {
                printError(error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
        });
};
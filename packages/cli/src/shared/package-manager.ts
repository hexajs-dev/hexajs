import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

export const ALL_PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const;
export type PackageManager = (typeof ALL_PACKAGE_MANAGERS)[number];

interface CommandParts {
    command: string;
    args: string[];
    display: string;
}

function getVersionCommandEnv(): NodeJS.ProcessEnv {
    return {
        ...process.env,
        COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
    };
}

function isPackageManager(value: string): value is PackageManager {
    return (ALL_PACKAGE_MANAGERS as readonly string[]).includes(value);
}

function assertPackageManager(value: string, source: string): PackageManager {
    if (!isPackageManager(value)) {
        throw new Error(`Invalid package manager "${value}" in ${source}. Allowed values: ${ALL_PACKAGE_MANAGERS.join(', ')}.`);
    }
    return value;
}

function getWindowsCmdPath(): string {
    const systemRoot = process.env.SystemRoot || process.env.WINDIR;
    if (systemRoot) {
        const cmdPath = path.join(systemRoot, 'System32', 'cmd.exe');
        if (fs.existsSync(cmdPath)) {
            return cmdPath;
        }
    }

    throw new Error('Unable to resolve trusted Windows cmd.exe path from SystemRoot/WINDIR.');
}

function getWindowsCommandArgs(commandText: string): string[] {
    return ['/d', '/s', '/c', commandText];
}

function isCommandAvailable(commandName: string): boolean {
    try {
        if (process.platform === 'win32') {
            execFileSync(getWindowsCmdPath(), getWindowsCommandArgs(`where ${commandName}`), {
                encoding: 'utf-8',
                stdio: 'pipe',
                windowsHide: true,
            });
            return true;
        }

        execFileSync('which', [commandName], {
            encoding: 'utf-8',
            stdio: 'pipe',
        });
        return true;
    } catch {
        return false;
    }
}

function runVersionCommand(pm: PackageManager): string {
    const safePm = assertPackageManager(pm, 'runVersionCommand()');
    if (process.platform === 'win32') {
        return execFileSync(getWindowsCmdPath(), getWindowsCommandArgs(`${safePm} --version`), {
            encoding: 'utf-8',
            stdio: 'pipe',
            env: getVersionCommandEnv(),
            windowsHide: true,
        }).trim();
    }

    return execFileSync(safePm, ['--version'], {
        encoding: 'utf-8',
        stdio: 'pipe',
        env: getVersionCommandEnv(),
    }).trim();
}

export function detectAvailablePMs(): PackageManager[] {
    return ALL_PACKAGE_MANAGERS.filter((pm) => isCommandAvailable(pm));
}

export function getPackageManagerVersion(pm: PackageManager): string {
    try {
        const version = runVersionCommand(pm);
        return version || '0.0.0';
    } catch {
        return '0.0.0';
    }
}

export function getInstallCommand(pm: PackageManager): CommandParts {
    const safePm = assertPackageManager(pm, 'getInstallCommand()');
    if (process.platform === 'win32') {
        return {
            command: getWindowsCmdPath(),
            args: getWindowsCommandArgs(`${safePm} install`),
            display: `${safePm} install`,
        };
    }

    return {
        command: safePm,
        args: ['install'],
        display: `${safePm} install`,
    };
}

export function getRunScriptCommand(pm: PackageManager, script: string): string {
    const safePm = assertPackageManager(pm, 'getRunScriptCommand()');

    switch (safePm) {
        case 'npm':
            return `npm run ${script}`;
        case 'bun':
            return `bun run ${script}`;
        case 'pnpm':
        case 'yarn':
            return `${safePm} ${script}`;
        default:
            return `npm run ${script}`;
    }
}

export function getAddDependencyCommand(pm: PackageManager, pkg: string, dev = false): string {
    const safePm = assertPackageManager(pm, 'getAddDependencyCommand()');

    switch (safePm) {
        case 'npm':
            return `npm install ${dev ? '--save-dev ' : ''}${pkg}`.trim();
        case 'pnpm':
            return `pnpm add ${dev ? '-D ' : ''}${pkg}`.trim();
        case 'yarn':
            return `yarn add ${dev ? '-D ' : ''}${pkg}`.trim();
        case 'bun':
            return `bun add ${dev ? '--dev ' : ''}${pkg}`.trim();
        default:
            return `npm install ${dev ? '--save-dev ' : ''}${pkg}`.trim();
    }
}

export function detectProjectPM(cwd: string): PackageManager {
    const bunLockPath = path.join(cwd, 'bun.lockb');
    const pnpmLockPath = path.join(cwd, 'pnpm-lock.yaml');
    const yarnLockPath = path.join(cwd, 'yarn.lock');
    const npmLockPath = path.join(cwd, 'package-lock.json');

    if (fs.existsSync(bunLockPath)) return 'bun';
    if (fs.existsSync(pnpmLockPath)) return 'pnpm';
    if (fs.existsSync(yarnLockPath)) return 'yarn';
    if (fs.existsSync(npmLockPath)) return 'npm';

    const packageJsonPath = path.join(cwd, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        try {
            const raw = fs.readFileSync(packageJsonPath, 'utf-8');
            const parsed = JSON.parse(raw) as { packageManager?: string };
            if (parsed.packageManager) {
                const [name] = parsed.packageManager.split('@');
                if (name && isPackageManager(name)) {
                    return name;
                }
            }
        } catch {
            // ignore malformed package.json and fallback below
        }
    }

    return 'npm';
}

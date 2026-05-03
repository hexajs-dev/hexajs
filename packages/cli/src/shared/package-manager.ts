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

function isPackageManager(value: string): value is PackageManager {
    return (ALL_PACKAGE_MANAGERS as readonly string[]).includes(value);
}

function getWindowsCommandArgs(commandText: string): string[] {
    return ['/d', '/s', '/c', commandText];
}

function runVersionCommand(pm: PackageManager): string {
    if (process.platform === 'win32') {
        return execFileSync('cmd.exe', getWindowsCommandArgs(`${pm} --version`), {
            encoding: 'utf-8',
            stdio: 'pipe',
            windowsHide: true,
        }).trim();
    }

    return execFileSync(pm, ['--version'], {
        encoding: 'utf-8',
        stdio: 'pipe',
    }).trim();
}

export function detectAvailablePMs(): PackageManager[] {
    return ALL_PACKAGE_MANAGERS.filter((pm) => {
        try {
            runVersionCommand(pm);
            return true;
        } catch {
            return false;
        }
    });
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
    if (process.platform === 'win32') {
        return {
            command: 'cmd.exe',
            args: getWindowsCommandArgs(`${pm} install`),
            display: `${pm} install`,
        };
    }

    return {
        command: pm,
        args: ['install'],
        display: `${pm} install`,
    };
}

export function getRunScriptCommand(pm: PackageManager, script: string): string {
    switch (pm) {
        case 'npm':
            return `npm run ${script}`;
        case 'bun':
            return `bun run ${script}`;
        case 'pnpm':
        case 'yarn':
            return `${pm} ${script}`;
        default:
            return `npm run ${script}`;
    }
}

export function getAddDependencyCommand(pm: PackageManager, pkg: string, dev = false): string {
    switch (pm) {
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

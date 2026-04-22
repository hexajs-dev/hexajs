import * as fs from 'fs';
import * as path from 'path';
import { ResolvedBuildConfig } from '../bin/config/resolve';
import { ManagedUISurface } from './events';

export interface UIWatchTarget {
    surface: ManagedUISurface;
    sourceDir: string;
}

const WATCHABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.scss']);

export function resolveManagedUiWatchTargets(resolved: ResolvedBuildConfig, cwd: string = process.cwd()): UIWatchTarget[] {
    const targets: UIWatchTarget[] = [];

    const popup = resolved.ui?.popup;
    if ((popup?.mode ?? 'none') === 'managed') {
        targets.push({
            surface: 'popup',
            sourceDir: path.resolve(cwd, popup?.sourceDir ?? path.join('ui', 'popup')),
        });
    }

    const devtools = resolved.ui?.devtools;
    if ((devtools?.mode ?? 'none') === 'managed') {
        targets.push({
            surface: 'devtools',
            sourceDir: path.resolve(cwd, devtools?.sourceDir ?? path.join('ui', 'devtools')),
        });
    }

    return targets;
}

export function isWatchableUiFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return WATCHABLE_EXTENSIONS.has(extension);
}

export function startManagedUiWatcher(sourceDir: string, onChange: (absolutePath: string) => void): fs.FSWatcher {
    if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
        throw new Error(`Managed UI watch source directory does not exist: ${sourceDir}`);
    }

    return fs.watch(sourceDir, { recursive: true }, (_eventType, filename) => {
        if (!filename) {
            return;
        }

        const absolute = path.resolve(sourceDir, filename.toString());
        if (!isWatchableUiFile(absolute)) {
            return;
        }

        onChange(absolute);
    });
}

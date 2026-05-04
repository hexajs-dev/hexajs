import * as fs from 'fs';
import * as path from 'path';

export function relativePathFromCwd(filePath: string): string {
    const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    return rel || path.basename(filePath);
}

export function normalizeManifestPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

export function resolveForComparison(filePath: string): string {
    try {
        return fs.realpathSync(filePath);
    } catch {
        return path.resolve(filePath);
    }
}

export function isPathWithinRoot(rootPath: string, candidatePath: string): boolean {
    const normalizedRootPath = resolveForComparison(rootPath);
    const normalizedCandidatePath = resolveForComparison(candidatePath);
    const relative = path.relative(normalizedRootPath, normalizedCandidatePath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export function assertPathWithinRoot(rootPath: string, candidatePath: string, errorMessage: string): void {
    if (!isPathWithinRoot(rootPath, candidatePath)) {
        throw new Error(errorMessage);
    }
}

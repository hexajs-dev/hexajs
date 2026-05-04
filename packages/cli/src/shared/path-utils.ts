import * as fs from 'fs';
import * as path from 'path';

export function relativePathFromCwd(filePath: string): string {
    const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    return rel || path.basename(filePath);
}

export function normalizeManifestPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

const MAX_ANCESTOR_LOOKUP_STEPS = 1024;
const MAX_ANCESTOR_LOOKUP_MS = 2000;

export function resolveForComparison(filePath: string): string {
    const absolutePath = path.resolve(filePath);

    try {
        return fs.realpathSync(absolutePath);
    } catch {
        // For paths that don't exist yet (e.g., planned sourceRoot), resolve through
        // the closest existing ancestor so symlinks (like /var -> /private/var on macOS)
        // are canonicalized consistently.
        let current = absolutePath;
        const tailSegments: string[] = [];
        const lookupStartedAt = Date.now();
        let lookupSteps = 0;

        while (!fs.existsSync(current)) {
            lookupSteps += 1;
            const lookupTimedOut = Date.now() - lookupStartedAt > MAX_ANCESTOR_LOOKUP_MS;
            if (lookupTimedOut || lookupSteps > MAX_ANCESTOR_LOOKUP_STEPS) {
                return absolutePath;
            }

            const parent = path.dirname(current);
            if (parent === current) {
                return absolutePath;
            }
            tailSegments.unshift(path.basename(current));
            current = parent;
        }

        const canonicalExistingPath = fs.realpathSync(current);
        return path.join(canonicalExistingPath, ...tailSegments);
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

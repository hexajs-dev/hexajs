import * as path from 'path';

export function relativePathFromCwd(filePath: string): string {
    const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    return rel || path.basename(filePath);
}

export function normalizeManifestPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

export function relativeFromCwd(filePath: string): string {
    return relativePathFromCwd(filePath);
}

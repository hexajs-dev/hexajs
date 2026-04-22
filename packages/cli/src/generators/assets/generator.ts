import * as fs from 'fs';
import * as path from 'path';
import fg from 'fast-glob';
import { ResolvedBuildConfig } from '../../bin/config/resolve';

function normalizePathForLog(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

function getDestinationPath(filePath: string, sourceRootAbs: string, cwd: string, outputDir: string): string {
    const fileAbs = path.resolve(cwd, filePath);
    const fromSourceRoot = path.relative(sourceRootAbs, fileAbs);
    const relativePath = !fromSourceRoot.startsWith('..') && !path.isAbsolute(fromSourceRoot)
        ? fromSourceRoot
        : path.relative(cwd, fileAbs);

    return path.join(outputDir, relativePath);
}

export async function copyStaticAssets(resolved: ResolvedBuildConfig, outputDir: string): Promise<void> {
    const patterns = resolved.compilerOptions.assets ?? [];
    if (patterns.length === 0) return;

    const cwd = process.cwd();
    const sourceRootAbs = path.resolve(cwd, resolved.project.sourceRoot ?? 'src');
    const files = await fg(patterns, { cwd, onlyFiles: true, dot: true, unique: true, followSymbolicLinks: true });

    if (files.length === 0) return;

    for (const file of files) {
        const destination = getDestinationPath(file, sourceRootAbs, cwd, outputDir);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(path.resolve(cwd, file), destination);
    }

    console.log(`✓ Copied ${files.length} static asset(s) from compilerOptions.assets`);
    console.log(`  ${files.slice(0, 3).map(normalizePathForLog).join(', ')}${files.length > 3 ? ', ...' : ''}`);
}

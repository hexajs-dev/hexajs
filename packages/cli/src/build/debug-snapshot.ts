import * as fs from 'fs';
import * as path from 'path';
import { ResolvedBuildConfig } from '../bin/config/resolve';
import { GeneratedArtifactRow } from './types';

export type DebugSnapshotContext = 'background' | 'content' | 'ui';

export function persistDebugGeneratedArtifacts(resolved: ResolvedBuildConfig, outputDir: string, rows: GeneratedArtifactRow[], context: DebugSnapshotContext): void {
    if (!resolved.debug || rows.length === 0) {
        return;
    }

    const contextDir = path.join(process.cwd(), '.hexa', 'generated-debug', context);
    fs.rmSync(contextDir, { recursive: true, force: true });
    fs.mkdirSync(contextDir, { recursive: true });

    rows.forEach((row) => {
        const sourcePath = path.resolve(process.cwd(), row.file);
        if (!fs.existsSync(sourcePath)) {
            return;
        }

        const relativeToOutput = path.relative(outputDir, sourcePath);
        const targetRelativePath = relativeToOutput.startsWith('..') ? path.basename(sourcePath) : relativeToOutput;
        const targetPath = path.join(contextDir, targetRelativePath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.copyFileSync(sourcePath, targetPath);
    });
}

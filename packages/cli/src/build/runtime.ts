import * as fs from 'fs';
import * as path from 'path';
import { GeneratedArtifactRow } from './types';
import { relativePathFromCwd } from '../shared/path-utils';

function formatBytes(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    }
    const kb = size / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} kB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
}

export function writeGeneratedFile(filePath: string, content: string): GeneratedArtifactRow {
    const start = process.hrtime.bigint();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');

    const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const size = Buffer.byteLength(content, 'utf8');
    return {
        file: relativePathFromCwd(filePath),
        size: formatBytes(size),
        duration: `${elapsedMs.toFixed(1)} ms`,
    };
}

export async function withQuietLogs<T>(quiet: boolean, run: () => Promise<T> | T): Promise<T> {
    if (!quiet) {
        return await run();
    }

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalEmitWarning = process.emitWarning.bind(process);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    let suppressTypelessWarningBlock = false;

    console.log = () => undefined;
    console.warn = () => undefined;
    process.emitWarning = ((warning: any, type?: any, code?: any, ctor?: any) => {
        const warningMessage = typeof warning === 'string' ? warning : warning?.message ?? '';
        const warningCode = typeof warning === 'object' && warning ? warning.code : code;
        if (warningCode === 'MODULE_TYPELESS_PACKAGE_JSON' || warningMessage.includes('MODULE_TYPELESS_PACKAGE_JSON')) {
            return;
        }
        return (originalEmitWarning as any)(warning, type as any, code as any, ctor as any);
    }) as typeof process.emitWarning;
    process.stderr.write = ((chunk: any, encoding?: any, callback?: any) => {
        const text = typeof chunk === 'string' ? chunk : chunk?.toString?.(encoding || 'utf8') || '';

        if (text.includes('MODULE_TYPELESS_PACKAGE_JSON')) {
            suppressTypelessWarningBlock = true;
            if (typeof callback === 'function') {
                callback();
            }
            return true;
        }

        if (suppressTypelessWarningBlock) {
            if (text.includes('where the warning was created)')) {
                suppressTypelessWarningBlock = false;
            }
            if (typeof callback === 'function') {
                callback();
            }
            return true;
        }

        return (originalStderrWrite as any)(chunk, encoding, callback);
    }) as typeof process.stderr.write;

    try {
        return await run();
    } finally {
        console.log = originalLog;
        console.warn = originalWarn;
        process.emitWarning = originalEmitWarning;
        process.stderr.write = originalStderrWrite;
    }
}

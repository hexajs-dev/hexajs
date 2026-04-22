import * as fs from 'fs';
import * as path from 'path';
import { cleanIntermediateFiles } from '../bundler';
import { BuildTarget } from './types';
import { shouldWriteStoreForTarget } from './target-selection';

function removeOutputPath(targetPath: string): void {
    if (!fs.existsSync(targetPath)) {
        return;
    }

    fs.rmSync(targetPath, { recursive: true, force: true });
}

function loadPreviousContentScriptFiles(outputDir: string): string[] {
    const manifestPath = path.join(outputDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
        return [];
    }

    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
            content_scripts?: Array<{ js?: string[] }>;
        };

        const files = manifest.content_scripts?.flatMap((entry) => entry.js ?? []) ?? [];
        return Array.from(new Set(files.filter((fileName) => fileName.endsWith('.js'))));
    } catch {
        return [];
    }
}

export function prepareOutputDirForTarget(outputDir: string, target: BuildTarget): void {
    if (target === 'all') {
        removeOutputPath(outputDir);
        fs.mkdirSync(outputDir, { recursive: true });
        return;
    }

    fs.mkdirSync(outputDir, { recursive: true });

    if (target === 'content') {
        loadPreviousContentScriptFiles(outputDir).forEach((fileName) => {
            removeOutputPath(path.join(outputDir, fileName));
        });
        removeOutputPath(path.join(outputDir, 'content', 'content.validators.js'));
        removeOutputPath(path.join(outputDir, 'content', 'content.store.js'));
        return;
    }

    if (target === 'background') {
        removeOutputPath(path.join(outputDir, 'background'));
        removeOutputPath(path.join(outputDir, 'background', 'hexa-vendor-background.js'));
        removeOutputPath(path.join(outputDir, 'background', 'hexa-vendor-worker.js'));
        return;
    }

    if (target === 'ui') {
        removeOutputPath(path.join(outputDir, 'ui'));
    }
}

export function cleanupStoresForTarget(outputDir: string, storeContexts: string[], target: BuildTarget): void {
    const shouldDelete = storeContexts.filter(context => shouldWriteStoreForTarget(target, context));
    const files = shouldDelete.map(context => {
        const contextName = context.toLowerCase();
        return path.join(contextName, `${contextName}.store.js`);
    });
    if (files.length > 0) {
        cleanIntermediateFiles(outputDir, files);
    }
}

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { MetadataRegistry } from '../compiler/registry';
import { HexaContext } from '../compiler/di/types';
import { BuildContext, BuildContextMapRecord } from './types';
import { relativePathFromCwd } from '../shared/path-utils';

const ALL_CONTEXTS: BuildContext[] = ['background', 'content', 'ui'];
const CONTEXT_MAP_FILE_PREFIX = '.ctx.';
const CONTEXT_MAP_FILE_SUFFIX = '.bin';
const LEGACY_CONTEXT_MAP_FILES = ['.context-map.json', 'build-context-map.json'];

type PersistedContextMapEnvelope = {
    v: 1;
    checksum: string;
    data: string;
};

function normalizeAbsoluteFilePath(filePath: string): string {
    return path.normalize(path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath));
}

function isRuntimeContext(value: string): value is BuildContext {
    return value === 'background' || value === 'content' || value === 'ui';
}

function expandContext(context: string): BuildContext[] {
    if (context === HexaContext.General) {
        return ALL_CONTEXTS;
    }
    if (isRuntimeContext(context)) {
        return [context];
    }
    return [];
}

function collectImportGraph(program: ts.Program): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    const compilerOptions = program.getCompilerOptions();

    for (const sourceFile of program.getSourceFiles()) {
        if (sourceFile.isDeclarationFile) {
            continue;
        }

        const sourcePath = normalizeAbsoluteFilePath(sourceFile.fileName);
        const edges = new Set<string>();
        graph.set(sourcePath, edges);

        for (const statement of sourceFile.statements) {
            if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) {
                continue;
            }
            const moduleSpecifier = statement.moduleSpecifier;
            if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) {
                continue;
            }

            const resolution = ts.resolveModuleName(moduleSpecifier.text, sourceFile.fileName, compilerOptions, ts.sys);
            const resolvedModule = resolution.resolvedModule;
            if (!resolvedModule || resolvedModule.isExternalLibraryImport) {
                continue;
            }

            const resolvedPath = normalizeAbsoluteFilePath(resolvedModule.resolvedFileName);
            if (!resolvedPath.endsWith('.d.ts')) {
                edges.add(resolvedPath);
            }
        }
    }

    return graph;
}

function markFileContext(map: BuildContextMapRecord, absolutePath: string, context: BuildContext): void {
    if (!fs.existsSync(absolutePath) || absolutePath.endsWith('.d.ts')) {
        return;
    }

    const relativePath = relativePathFromCwd(absolutePath);
    if (!relativePath || relativePath.startsWith('..')) {
        return;
    }

    if (!map[relativePath]) {
        map[relativePath] = {};
    }
    map[relativePath][context] = true;
}

function propagateFromRoots(map: BuildContextMapRecord, graph: Map<string, Set<string>>, roots: Map<string, Set<BuildContext>>): void {
    for (const [rootPath, contexts] of roots.entries()) {
        for (const context of contexts) {
            const queue: string[] = [rootPath];
            const visited = new Set<string>();

            while (queue.length > 0) {
                const current = queue.shift()!;
                if (visited.has(current)) {
                    continue;
                }
                visited.add(current);
                markFileContext(map, current, context);

                const imports = graph.get(current);
                if (!imports) {
                    continue;
                }
                for (const importedFile of imports) {
                    if (!visited.has(importedFile)) {
                        queue.push(importedFile);
                    }
                }
            }
        }
    }
}

function addRootContext(roots: Map<string, Set<BuildContext>>, importPath: string, context: string): void {
    const expanded = expandContext(context);
    if (expanded.length === 0) {
        return;
    }

    const normalized = normalizeAbsoluteFilePath(importPath);
    if (!roots.has(normalized)) {
        roots.set(normalized, new Set<BuildContext>());
    }

    const set = roots.get(normalized)!;
    expanded.forEach(ctx => set.add(ctx));
}

function collectRootContexts(registry: MetadataRegistry): Map<string, Set<BuildContext>> {
    const roots = new Map<string, Set<BuildContext>>();

    registry.getServices().forEach(service => addRootContext(roots, service.importPath, service.context));
    registry.getControllers().forEach(controller => addRootContext(roots, controller.importPath, 'background'));
    registry.getHandlers().forEach(handler => addRootContext(roots, handler.importPath, 'content'));
    registry.getBackgroundEntries().forEach(entry => addRootContext(roots, entry.importPath, 'background'));
    registry.getContentEntries().forEach(entry => addRootContext(roots, entry.importPath, 'content'));
    registry.getWorkers().forEach(worker => addRootContext(roots, worker.importPath, 'background'));

    registry.getStates().forEach(state => {
        const contexts = expandContext(state.context);
        Object.values(state.state).forEach(reducer => {
            contexts.forEach(ctx => addRootContext(roots, reducer.importPath, ctx));
        });
    });

    return roots;
}

function getCacheDir(): string {
    return path.join(process.cwd(), '.hexa');
}

function xorBuffer(input: Buffer, key: Buffer): Buffer {
    const output = Buffer.allocUnsafe(input.length);
    for (let i = 0; i < input.length; i += 1) {
        output[i] = input[i] ^ key[i % key.length];
    }
    return output;
}

function getEncodingKey(): Buffer {
    return crypto.createHash('sha256').update(process.cwd()).digest();
}

function encodeContextMap(fileMap: BuildContextMapRecord): string {
    const payload = Buffer.from(JSON.stringify(fileMap), 'utf-8');
    return xorBuffer(payload, getEncodingKey()).toString('base64');
}

function decodeContextMap(encodedPayload: string): BuildContextMapRecord {
    const decoded = Buffer.from(encodedPayload, 'base64');
    const plain = xorBuffer(decoded, getEncodingKey()).toString('utf-8');
    return JSON.parse(plain);
}

function listHashedContextMapFiles(cacheDir: string): string[] {
    if (!fs.existsSync(cacheDir)) {
        return [];
    }

    return fs
        .readdirSync(cacheDir)
        .filter(fileName => fileName.startsWith(CONTEXT_MAP_FILE_PREFIX) && fileName.endsWith(CONTEXT_MAP_FILE_SUFFIX))
        .map(fileName => path.join(cacheDir, fileName))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
}

function ensureContextMapObject(value: unknown): BuildContextMapRecord {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }
    return value as BuildContextMapRecord;
}

function parseHashedContextMap(content: string): BuildContextMapRecord {
    const envelope = JSON.parse(content) as PersistedContextMapEnvelope;
    if (!envelope || envelope.v !== 1 || typeof envelope.data !== 'string' || typeof envelope.checksum !== 'string') {
        throw new Error('Invalid context map envelope format.');
    }

    const actualChecksum = crypto.createHash('sha256').update(envelope.data).digest('hex');
    if (actualChecksum !== envelope.checksum) {
        throw new Error('Context map checksum mismatch.');
    }

    return ensureContextMapObject(decodeContextMap(envelope.data));
}

function cleanupLegacyContextMapFiles(cacheDir: string, keepFilePath: string): void {
    const hashedFiles = listHashedContextMapFiles(cacheDir);
    for (const filePath of hashedFiles) {
        if (filePath !== keepFilePath && fs.existsSync(filePath)) {
            fs.rmSync(filePath, { force: true });
        }
    }

    for (const legacyName of LEGACY_CONTEXT_MAP_FILES) {
        const legacyPath = path.join(cacheDir, legacyName);
        if (fs.existsSync(legacyPath)) {
            fs.rmSync(legacyPath, { force: true });
        }
    }
}

export function buildSourceContextMap(program: ts.Program, registry: MetadataRegistry): BuildContextMapRecord {
    const graph = collectImportGraph(program);
    const roots = collectRootContexts(registry);
    const map: BuildContextMapRecord = {};

    propagateFromRoots(map, graph, roots);

    return Object.keys(map)
        .sort()
        .reduce<BuildContextMapRecord>((acc, key) => {
            const value = map[key];
            const ordered: Partial<Record<BuildContext, true>> = {};
            if (value.background) ordered.background = true;
            if (value.content) ordered.content = true;
            if (value.ui) ordered.ui = true;
            acc[key] = ordered;
            return acc;
        }, {});
}

export function writeSourceContextMap(fileMap: BuildContextMapRecord): void {
    const cacheDir = getCacheDir();
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const encodedMap = encodeContextMap(fileMap);
    const envelope: PersistedContextMapEnvelope = {
        v: 1,
        checksum: crypto.createHash('sha256').update(encodedMap).digest('hex'),
        data: encodedMap,
    };

    const envelopeJson = JSON.stringify(envelope);
    const fileHash = crypto.createHash('sha256').update(envelopeJson).digest('hex').slice(0, 20);
    const fileName = `${CONTEXT_MAP_FILE_PREFIX}${fileHash}${CONTEXT_MAP_FILE_SUFFIX}`;
    const targetPath = path.join(cacheDir, fileName);

    fs.writeFileSync(targetPath, envelopeJson, 'utf-8');
    cleanupLegacyContextMapFiles(cacheDir, targetPath);
}

export function readSourceContextMap(): BuildContextMapRecord {
    const cacheDir = getCacheDir();
    const hashedFiles = listHashedContextMapFiles(cacheDir);

    for (const filePath of hashedFiles) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return parseHashedContextMap(content);
        } catch {
            // Try next candidate file.
        }
    }

    for (const legacyName of LEGACY_CONTEXT_MAP_FILES) {
        const legacyPath = path.join(cacheDir, legacyName);
        if (!fs.existsSync(legacyPath)) {
            continue;
        }

        try {
            const content = fs.readFileSync(legacyPath, 'utf-8');
            return ensureContextMapObject(JSON.parse(content));
        } catch {
            // Continue to next legacy candidate.
        }
    }

    return {};
}

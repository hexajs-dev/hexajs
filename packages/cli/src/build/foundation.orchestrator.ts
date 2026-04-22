import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { Analyzer } from '../analyzer/analyzer';
import { ConfigToken } from '../bin/config/config';
import { ResolvedBuildConfig } from '../bin/config/resolve';
import { Scanner } from '../compiler/scanner';
import { MetadataRegistry } from '../compiler/registry';
import { StoreGenerator, StoreScriptOutput } from '../generators/store/generator';
import { mergeTokensWithCodeDefaults } from '../shared/methods';
import { BuildFoundationOutput } from './types';

const HEXA_PLATFORM = 'HEXA_PLATFORM';
const HEXA_BUILD_MODE = 'HEXA_BUILD_MODE';
const HEXA_DEBUG = 'HEXA_DEBUG';

function extractImportSpecifierText(file: ts.SourceFile, start: number, length: number): string | null {
    const raw = file.text.slice(start, start + length).trim();
    if (
        (raw.startsWith('"') && raw.endsWith('"'))
        || (raw.startsWith("'") && raw.endsWith("'"))
    ) {
        return raw.slice(1, -1);
    }
    return null;
}

function shouldIgnoreDiagnostic(diagnostic: ts.Diagnostic): boolean {
    // Vite-style inline resource imports (e.g., .scss?inline) are resolved by bundling,
    // not TypeScript module resolution.
    if (diagnostic.code === 2307 && diagnostic.file && diagnostic.start !== undefined && diagnostic.length !== undefined) {
        const specifier = extractImportSpecifierText(diagnostic.file, diagnostic.start, diagnostic.length);
        if (specifier?.includes('?inline')) {
            return true;
        }
    }
    return false;
}

function createDiagnosticsError(program: ts.Program): Error | null {
    const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .filter((diagnostic) => !shouldIgnoreDiagnostic(diagnostic));

    const errors = diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
    if (errors.length === 0) {
        return null;
    }

    const formatHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: (fileName: string) => fileName,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => ts.sys.newLine,
    };

    const formatted = ts.formatDiagnosticsWithColorAndContext(errors, formatHost);
    return new Error(`TypeScript diagnostics failed before HexaJS generation.\n${formatted}`);
}

function normalizeCompilerOptions(options?: ts.CompilerOptions): ts.CompilerOptions {
    return options || {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
    };
}

function buildTokens(registry: MetadataRegistry, resolved: ResolvedBuildConfig): ConfigToken[] {
    const systemTokens: ConfigToken[] = [
        { key: HEXA_PLATFORM, value: resolved.platform },
        { key: HEXA_BUILD_MODE, value: resolved.mode },
        ...(resolved.debug ? [{ key: HEXA_DEBUG, value: true }] : []),
    ];

    return mergeTokensWithCodeDefaults(systemTokens, registry.getTokens(), resolved.tokens || []);
}

function selectStoreOutputsByTarget(storeOutputs: StoreScriptOutput[], target: 'all' | 'ui' | 'content' | 'background'): StoreScriptOutput[] {
    if (target === 'all') {
        return storeOutputs;
    }
    if (target === 'background') {
        return storeOutputs.filter(store => store.context === 'background');
    }
    if (target === 'content') {
        return storeOutputs.filter(store => store.context === 'content');
    }
    return [];
}

export function runFoundationOrchestrator(files: string[], resolved: ResolvedBuildConfig, options: ts.CompilerOptions | undefined, verbose: boolean, target: 'all' | 'ui' | 'content' | 'background'): BuildFoundationOutput {
    const compilerOptions = normalizeCompilerOptions(options);
    const registry = new MetadataRegistry();
    const program = ts.createProgram(files, compilerOptions);

    const diagnosticsError = createDiagnosticsError(program);
    if (diagnosticsError) {
        throw diagnosticsError;
    }

    const scanner = new Scanner(program, resolved);
    scanner.scan(program, registry);
    registry.setPackageMetadata(scanner.getPackageMetadata());

    const analyzer = new Analyzer(registry, resolved, scanner.getPackageMetadata());
    const analysisResult = analyzer.analyze();
    analyzer.report(analysisResult, verbose);

    const outputDir = path.join(process.cwd(), resolved.outDir);
    fs.mkdirSync(outputDir, { recursive: true });

    const mergedTokens = buildTokens(registry, resolved);
    const storeGenerator = new StoreGenerator(registry, outputDir);
    const allStoreOutputs = storeGenerator.generate();
    const storeOutputs = selectStoreOutputsByTarget(allStoreOutputs, target);

    return { registry, program, resolved, outputDir, mergedTokens, storeOutputs };
}

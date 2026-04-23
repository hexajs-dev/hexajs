import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { DIScanner } from '../src/compiler/di/scanner';
import { ServiceMetadata } from '../src/compiler/di/types';
import { ViewScanner } from '../src/compiler/content/view/scanner';
import { ViewMetadata } from '../src/compiler/content/view/types';

function createProgramFromFiles(files: Record<string, string>): ts.Program {
  const fileNames = Object.keys(files);
  const host = ts.createCompilerHost({ target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, experimentalDecorators: true });
  const originalGetSourceFile = host.getSourceFile;

  host.getSourceFile = (name, languageVersion) => {
    if (name in files) {
      return ts.createSourceFile(name, files[name], languageVersion, true, ts.ScriptKind.TS);
    }

    return originalGetSourceFile.call(host, name, languageVersion);
  };

  host.fileExists = (name) => name in files || ts.sys.fileExists(name);
  host.readFile = (name) => (name in files ? files[name] : ts.sys.readFile(name));
  host.resolveModuleNames = (moduleNames, containingFile) => {
    return moduleNames.map(moduleName => {
      if (!moduleName.startsWith('.')) {
        return ts.resolveModuleName(moduleName, containingFile, { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.NodeJs, target: ts.ScriptTarget.ESNext, experimentalDecorators: true }, ts.sys).resolvedModule;
      }

      const candidateTs = ts.resolvePath(ts.combinePaths(ts.getDirectoryPath(containingFile), `${moduleName}.ts`));
      if (candidateTs in files) {
        return { resolvedFileName: candidateTs, extension: ts.Extension.Ts };
      }

      const candidateIndex = ts.resolvePath(ts.combinePaths(ts.getDirectoryPath(containingFile), moduleName, 'index.ts'));
      if (candidateIndex in files) {
        return { resolvedFileName: candidateIndex, extension: ts.Extension.Ts };
      }

      return ts.resolveModuleName(moduleName, containingFile, { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.NodeJs, target: ts.ScriptTarget.ESNext, experimentalDecorators: true }, ts.sys).resolvedModule;
    });
  };

  return ts.createProgram(fileNames, { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.NodeJs, experimentalDecorators: true }, host);
}

function scanFirstService(files: Record<string, string>, entryFile = '/test.ts'): ServiceMetadata | null {
  const program = createProgramFromFiles(files);
  const checker = program.getTypeChecker();
  const scanner = new DIScanner(checker, false);
  const sourceFile = program.getSourceFile(entryFile);

  if (!sourceFile) {
    throw new Error(`Could not load source file: ${entryFile}`);
  }

  let result: ServiceMetadata | null = null;
  ts.forEachChild(sourceFile, node => {
    const metadata = scanner.scan(node);
    if (metadata && !result) {
      result = metadata;
    }
  });

  return result;
}

function scanFirstView(files: Record<string, string>, entryFile = '/test.ts'): ViewMetadata | null {
  const program = createProgramFromFiles(files);
  const checker = program.getTypeChecker();
  const diScanner = new DIScanner(checker, false);
  const scanner = new ViewScanner(checker, diScanner, '/');
  const sourceFile = program.getSourceFile(entryFile);

  if (!sourceFile) {
    throw new Error(`Could not load source file: ${entryFile}`);
  }

  let result: ViewMetadata | null = null;
  ts.forEachChild(sourceFile, node => {
    const metadata = scanner.scan(node);
    if (metadata && !result) {
      result = metadata;
    }
  });

  return result;
}

describe('Decorator source validation', () => {
  it('ignores an Injectable decorator imported from a non-Hexa module', () => {
    const result = scanFirstService({
      '/foreign.ts': `export function Injectable(): ClassDecorator { return (target) => target; }`,
      '/test.ts': `
        import { Injectable } from './foreign';

        @Injectable()
        class ForeignService {}
      `,
    });

    expect(result).toBeNull();
  });

  it('ignores an InjectView decorator imported from a non-Hexa module', () => {
    const result = scanFirstService({
      '/foreign.ts': `export function InjectView(): PropertyDecorator { return () => undefined; }`,
      '/test.ts': `
        import { InjectView } from './foreign';

        function Injectable(): ClassDecorator { return (target) => target; }

        class DashboardView {}

        @Injectable()
        class LocalService {
          @InjectView()
          dashboard!: DashboardView;
        }
      `,
    });

    expect(result).not.toBeNull();
    expect(result?.viewPropertyDependencies).toEqual([]);
  });

  it('ignores a View decorator imported from a non-Hexa module', () => {
    const result = scanFirstView({
      '/foreign.ts': `export function View(opts: any): ClassDecorator { return (target) => target; }`,
      '/component.ts': `export const DashboardComponent = {};`,
      '/test.ts': `
        import { View } from './foreign';
        import { DashboardComponent } from './component';

        @View({ id: 'foreign-view', component: DashboardComponent })
        class ForeignView {}
      `,
    });

    expect(result).toBeNull();
  });
});
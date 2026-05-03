import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { ControllerScanner } from '../src/compiler/background/controller/scanner';
import { ControllerMetadata } from '../src/compiler/background/controller/types';
import { DIScanner } from '../src/compiler/di/scanner';

function createProgram(source: string): ts.Program {
  return createProgramFromFiles({ '/test.ts': source });
}

function createProgramFromFiles(files: Record<string, string>): ts.Program {
  const fileNames = Object.keys(files);
  const host = ts.createCompilerHost({ target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext });
  const originalGetSourceFile = host.getSourceFile;
  host.getSourceFile = (name, languageVersion) => {
    if (name in files) {
      return ts.createSourceFile(name, files[name], languageVersion, true);
    }
    return originalGetSourceFile.call(host, name, languageVersion);
  };
  host.fileExists = (name) => name in files || ts.sys.fileExists(name);
  host.readFile = (name) => (name in files ? files[name] : ts.sys.readFile(name));
  host.resolveModuleNames = (moduleNames, containingFile) => {
    return moduleNames.map(moduleName => {
      if (!moduleName.startsWith('.')) {
        return ts.resolveModuleName(moduleName, containingFile, { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext }, ts.sys).resolvedModule;
      }

      const resolvedFileName = ts.resolvePath(ts.combinePaths(ts.getDirectoryPath(containingFile), `${moduleName}.ts`));
      if (resolvedFileName in files) {
        return { resolvedFileName, extension: ts.Extension.Ts };
      }

      return ts.resolveModuleName(moduleName, containingFile, { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext }, ts.sys).resolvedModule;
    });
  };

  return ts.createProgram(fileNames, { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.NodeJs }, host);
}

function scanController(source: string): ControllerMetadata | null {
  const program = createProgram(source);
  const checker = program.getTypeChecker();
  const diScanner = new DIScanner(checker, false);
  const scanner = new ControllerScanner(checker, diScanner);
  const sourceFile = program.getSourceFile('/test.ts');

  if (!sourceFile) {
    return null;
  }

  let result: ControllerMetadata | null = null;

  ts.forEachChild(sourceFile, node => {
    const meta = scanner.scan(node);
    if (meta) {
      result = meta;
    }
  });

  return result;
}

describe('ControllerScanner route boundary policy metadata', () => {
  it('resolves class and method boundary policies at build time for actions and events', () => {
    const source = `
      function Controller(opts: any): ClassDecorator { return () => undefined; }
      function Action(name: string): MethodDecorator { return () => undefined; }
      function On(name: string): MethodDecorator { return () => undefined; }
      function AllowExternal(opts?: any): MethodDecorator & ClassDecorator { return () => undefined; }
      function InternalOnly(): MethodDecorator & ClassDecorator { return () => undefined; }

      @AllowExternal({ ids: ['trusted.id'] })
      @Controller({ namespace: 'security' })
      class DemoController {
        @Action('ping')
        onPing(payload: unknown): { ok: true } { return { ok: true }; }

        @InternalOnly()
        @On('notify')
        onNotify(payload: unknown): void {}

        @AllowExternal({ origins: ['https://trusted.example'] })
        @On('fanout')
        onFanout(payload: unknown): void {}
      }
    `;

    const result = scanController(source);
    expect(result).not.toBeNull();

    const methods = result!.methods;
    const ping = methods.find(method => method.actionName === 'security:ping');
    const notify = methods.find(method => method.eventName === 'security:notify');
    const fanout = methods.find(method => method.eventName === 'security:fanout');

    expect(ping).toBeDefined();
    expect(ping!.boundaryPolicy).toEqual({ mode: 'allow-external', ids: ['trusted.id'] });
    expect(ping!.externalSubscribed).toBe(true);

    expect(notify).toBeDefined();
    expect(notify!.boundaryPolicy).toEqual({ mode: 'internal-only' });
    expect(notify!.externalSubscribed).toBe(false);

    expect(fanout).toBeDefined();
    expect(fanout!.boundaryPolicy).toEqual({ mode: 'allow-external', origins: ['https://trusted.example'] });
    expect(fanout!.externalSubscribed).toBe(true);
  });

  it('throws when AllowExternal and InternalOnly are applied together', () => {
    const source = `
      function Controller(opts: any): ClassDecorator { return () => undefined; }
      function Action(name: string): MethodDecorator { return () => undefined; }
      function AllowExternal(opts?: any): MethodDecorator & ClassDecorator { return () => undefined; }
      function InternalOnly(): MethodDecorator & ClassDecorator { return () => undefined; }

      @Controller({ namespace: 'security' })
      class DemoController {
        @AllowExternal()
        @InternalOnly()
        @Action('ping')
        onPing(payload: unknown): { ok: true } { return { ok: true }; }
      }
    `;

    expect(() => scanController(source)).toThrow(/cannot be used together/);
  });
});

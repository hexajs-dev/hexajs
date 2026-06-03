import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { ReducerScanner } from '../src/compiler/store/reducer/scanner';
import { ReducerMetadata } from '../src/compiler/store/reducer/types';
import { DIScanner } from '../src/compiler/di/scanner';

function createProgram(source: string): ts.Program {
  const files: Record<string, string> = { '/test.ts': source };
  const host = ts.createCompilerHost({ target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext });
  const originalGetSourceFile = host.getSourceFile;
  host.getSourceFile = (name, languageVersion) => {
    if (name in files) return ts.createSourceFile(name, files[name], languageVersion, true);
    return originalGetSourceFile.call(host, name, languageVersion);
  };
  host.fileExists = (name) => name in files || ts.sys.fileExists(name);
  host.readFile = (name) => (name in files ? files[name] : ts.sys.readFile(name));
  return ts.createProgram(['/test.ts'], { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }, host);
}

function scanReducer(source: string): ReducerMetadata | null {
  const program = createProgram(source);
  const checker = program.getTypeChecker();
  const diScanner = new DIScanner(checker, false);
  const scanner = new ReducerScanner(checker, diScanner);
  const sourceFile = program.getSourceFile('/test.ts')!;
  let result: ReducerMetadata | null = null;
  ts.forEachChild(sourceFile, (node) => {
    const meta = scanner.scan(node);
    if (meta) result = meta;
  });
  return result;
}

describe('ReducerScanner - initState detection', () => {
  it('detects sync initState (returns T directly)', () => {
    const source = `
      function Reducer(): ClassDecorator { return (t) => t; }
      abstract class HexaReducer<T> { initialState?: T; initState?(): T | Promise<T>; }

      @Reducer()
      class CounterReducer extends HexaReducer<number> {
        initState(): number { return 0; }
      }
    `;
    const result = scanReducer(source);
    expect(result).not.toBeNull();
    expect(result!.hasInitState).toBe(true);
    expect(result!.isAsyncInitState).toBe(false);
  });

  it('detects async initState (async keyword)', () => {
    const source = `
      function Reducer(): ClassDecorator { return (t) => t; }
      abstract class HexaReducer<T> { initialState?: T; initState?(): T | Promise<T>; }

      @Reducer()
      class ConfigReducer extends HexaReducer<{ key: string }> {
        async initState(): Promise<{ key: string }> { return { key: 'value' }; }
      }
    `;
    const result = scanReducer(source);
    expect(result).not.toBeNull();
    expect(result!.hasInitState).toBe(true);
    expect(result!.isAsyncInitState).toBe(true);
  });

  it('detects async initState (no async keyword, explicit Promise return type)', () => {
    const source = `
      function Reducer(): ClassDecorator { return (t) => t; }
      abstract class HexaReducer<T> { initialState?: T; initState?(): T | Promise<T>; }

      @Reducer()
      class ConfigReducer extends HexaReducer<string[]> {
        initState(): Promise<string[]> { return Promise.resolve([]); }
      }
    `;
    const result = scanReducer(source);
    expect(result).not.toBeNull();
    expect(result!.hasInitState).toBe(true);
    expect(result!.isAsyncInitState).toBe(true);
  });

  it('detects initialState property (no initState method)', () => {
    const source = `
      function Reducer(): ClassDecorator { return (t) => t; }
      abstract class HexaReducer<T> { initialState?: T; initState?(): T | Promise<T>; }

      @Reducer()
      class CounterReducer extends HexaReducer<number> {
        initialState: number = 0;
      }
    `;
    const result = scanReducer(source);
    expect(result).not.toBeNull();
    expect(result!.hasInitState).toBe(false);
    expect(result!.isAsyncInitState).toBe(false);
  });

  it('throws when both initialState and initState are defined', () => {
    const source = `
      function Reducer(): ClassDecorator { return (t) => t; }
      abstract class HexaReducer<T> { initialState?: T; initState?(): T | Promise<T>; }

      @Reducer()
      class BadReducer extends HexaReducer<number> {
        initialState: number = 0;
        initState(): number { return 1; }
      }
    `;
    expect(() => scanReducer(source)).toThrow(/defines both initialState and initState/);
  });

  it('throws when neither initialState nor initState is defined', () => {
    const source = `
      function Reducer(): ClassDecorator { return (t) => t; }
      abstract class HexaReducer<T> { initialState?: T; initState?(): T | Promise<T>; }

      @Reducer()
      class EmptyReducer extends HexaReducer<number> {}
    `;
    expect(() => scanReducer(source)).toThrow(/must define either initialState or initState/);
  });
});

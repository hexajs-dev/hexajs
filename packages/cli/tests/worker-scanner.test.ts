import { describe, expect, it } from 'vitest';
import * as ts from 'typescript';
import { WorkerScanner } from '../src/compiler/background/worker/scanner';
import { WorkerMetadata } from '../src/compiler/background/worker/types';
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

function scanWorker(source: string) {
  const program = createProgram(source);
  const checker = program.getTypeChecker();
  const diScanner = new DIScanner(checker, false);
  const workerScanner = new WorkerScanner(checker, diScanner);

  const sourceFile = program.getSourceFile('/test.ts')!;
  let result: WorkerMetadata | null = null;

  ts.forEachChild(sourceFile, (node) => {
    const meta = workerScanner.scan(node);
    if (meta) result = meta;
  });

  return result;
}

function expectWorker(result: WorkerMetadata | null): WorkerMetadata {
  expect(result).not.toBeNull();

  if (!result) {
    throw new Error('Expected worker metadata');
  }

  return result;
}

describe('WorkerScanner', () => {
  it('detects @Worker decorator and extracts name', () => {
    const source = `
      function Worker(opts: any): ClassDecorator { return (t) => t; }
      @Worker({ name: 'crypto-task' })
      class CryptoWorker {
        async hashData(input: string): Promise<string> { return ''; }
      }
    `;
    const result = expectWorker(scanWorker(source));
    expect(result!.name).toBe('crypto-task');
    expect(result!.className).toBe('CryptoWorker');
    expect(result!.environment).toBe('compute');
    expect(result!.publicMethods).toContain('hashData');
  });

  it('extracts environment option', () => {
    const source = `
      function Worker(opts: any): ClassDecorator { return (t) => t; }
      @Worker({ name: 'renderer', environment: 'dom' })
      class RenderWorker {
        render(): void {}
      }
    `;
    const result = expectWorker(scanWorker(source));
    expect(result!.environment).toBe('dom');
  });

  it('returns null for classes without @Worker', () => {
    const source = `
      class PlainClass {
        doWork(): void {}
      }
    `;
    const result = scanWorker(source);
    expect(result).toBeNull();
  });

  it('excludes private and protected methods', () => {
    const source = `
      function Worker(opts: any): ClassDecorator { return (t) => t; }
      @Worker({ name: 'test-worker' })
      class TestWorker {
        publicMethod(): void {}
        private privateMethod(): void {}
        protected protectedMethod(): void {}
      }
    `;
    const result = expectWorker(scanWorker(source));
    expect(result!.publicMethods).toEqual(['publicMethod']);
  });

  it('excludes lifecycle methods', () => {
    const source = `
      function Worker(opts: any): ClassDecorator { return (t) => t; }
      @Worker({ name: 'lifecycle-worker' })
      class LifecycleWorker {
        compute(): number { return 0; }
        onInit(): void {}
        onDestroy(): void {}
      }
    `;
    const result = expectWorker(scanWorker(source));
    expect(result!.publicMethods).toEqual(['compute']);
  });

  it('returns null when name is missing', () => {
    const source = `
      function Worker(opts: any): ClassDecorator { return (t) => t; }
      @Worker({ environment: 'compute' })
      class NoNameWorker {
        run(): void {}
      }
    `;
    const result = scanWorker(source);
    expect(result).toBeNull();
  });

  it('extracts worker dependencies only when constructor uses @InjectWorker()', () => {
    const source = `
      function Worker(opts: any): ClassDecorator { return (t) => t; }
      function InjectWorker(): ParameterDecorator { return () => undefined; }

      @Worker({ name: 'ocr-worker' })
      class OcrWorker {
        recognize(): void {}
      }

      @Worker({ name: 'pipeline-worker' })
      class PipelineWorker {
        constructor(@InjectWorker() private ocrWorker: OcrWorker) {}

        run(): void {}
      }
    `;

    const result = expectWorker(scanWorker(source));
    expect(result!.dependencies).toEqual(['OcrWorker']);
  });

  it('throws when a worker dependency omits @InjectWorker()', () => {
    const source = `
      function Worker(opts: any): ClassDecorator { return (t) => t; }

      @Worker({ name: 'ocr-worker' })
      class OcrWorker {
        recognize(): void {}
      }

      @Worker({ name: 'pipeline-worker' })
      class PipelineWorker {
        constructor(private ocrWorker: OcrWorker) {}

        run(): void {}
      }
    `;

    expect(() => scanWorker(source)).toThrow(/must use @InjectWorker\(\)/);
  });

  it('throws when @InjectWorker() targets a non-worker class', () => {
    const source = `
      function Worker(opts: any): ClassDecorator { return (t) => t; }
      function Injectable(): ClassDecorator { return (t) => t; }
      function InjectWorker(): ParameterDecorator { return () => undefined; }

      @Injectable()
      class LoggerService {}

      @Worker({ name: 'pipeline-worker' })
      class PipelineWorker {
        constructor(@InjectWorker() private logger: LoggerService) {}

        run(): void {}
      }
    `;

    expect(() => scanWorker(source)).toThrow(/can only be used with classes decorated by @Worker/);
  });

  it('ignores a Worker decorator imported from a non-Hexa module', () => {
    const program = createProgramFromFiles({
      '/other.ts': `export function Worker(opts: any): ClassDecorator { return (t) => t; }`,
      '/test.ts': `
        import { Worker } from './other';

        @Worker({ name: 'wrong-worker' })
        class WrongWorker {
          run(): void {}
        }
      `,
    });

    const checker = program.getTypeChecker();
    const diScanner = new DIScanner(checker, false);
    const workerScanner = new WorkerScanner(checker, diScanner);
    const sourceFile = program.getSourceFile('/test.ts')!;
    let result: WorkerMetadata | null = null;

    ts.forEachChild(sourceFile, (node) => {
      const meta = workerScanner.scan(node);
      if (meta) result = meta;
    });

    expect(result).toBeNull();
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as ts from 'typescript';
import { DIScanner } from '../src/compiler/di/scanner';
import { ViewScanner } from '../src/compiler/content/view/scanner';

const tempDirs: string[] = [];

function createFixture(files: Record<string, string>) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hexa-view-security-'));
  tempDirs.push(rootDir);

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return rootDir;
}

function scanFirstClass(rootDir: string, entryRelativePath: string) {
  const entryFile = path.join(rootDir, entryRelativePath);
  const program = ts.createProgram([entryFile], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    experimentalDecorators: true,
  });

  const checker = program.getTypeChecker();
  const diScanner = new DIScanner(checker, false);
  const viewScanner = new ViewScanner(checker, diScanner, rootDir);
  const sourceFile = program.getSourceFile(entryFile);

  if (!sourceFile) {
    throw new Error(`Could not load source file: ${entryFile}`);
  }

  let found: ts.ClassDeclaration | null = null;
  ts.forEachChild(sourceFile, node => {
    if (ts.isClassDeclaration(node) && !found) found = node;
  });

  if (!found) {
    throw new Error('No class declaration found in fixture file.');
  }

  return () => viewScanner.scan(found!);
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('ViewScanner security', () => {
  it('rejects relative paths that escape the project root', () => {
    const rootDir = createFixture({
      'src/view.ts': [
        "import { OutComponent } from '../../outside/component';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: 'v1', component: OutComponent })",
        'class EscapeView {}',
      ].join('\n'),
      '../outside/component.ts': 'export const OutComponent = {};',
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/outside the project root/);
  });

  it('rejects absolute import paths for component/style imports', () => {
    const rootDir = createFixture({
      'src/view.ts': [
        "import { AbsComponent } from '/etc/passwd';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: 'v2', component: AbsComponent })",
        'class AbsoluteView {}',
      ].join('\n'),
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/absolute import paths are not allowed/);
  });

  it('rejects unsupported query suffix keys', () => {
    const rootDir = createFixture({
      'src/component.ts': 'export const MyComponent = {};',
      'src/view.ts': [
        "import { MyComponent } from './component?worker';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: 'v3', component: MyComponent })",
        'class UnsafeQueryView {}',
      ].join('\n'),
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/unsupported import query key/);
  });

  it('allows known-safe query suffix keys', () => {
    const rootDir = createFixture({
      'src/component.ts': 'export const MyComponent = {};',
      'src/view.ts': [
        "import { MyComponent } from './component?raw';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: 'v4', component: MyComponent })",
        'class SafeQueryView {}',
      ].join('\n'),
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    const metadata = run();
    expect(metadata).not.toBeNull();
    expect(metadata?.componentImportPath).toContain('?raw');
  });
});

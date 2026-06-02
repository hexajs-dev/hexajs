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
  // SC-02: id validation tests
  it('rejects id starting with non-letter', () => {
    const rootDir = createFixture({
      'src/view.ts': [
        "import { MyComponent } from './component';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: '123-invalid', component: MyComponent })",
        'class BadIdView {}',
      ].join('\n'),
      'src/component.ts': 'export const MyComponent = {};',
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/must start with a letter/);
  });

  it('rejects id containing quotes or special characters', () => {
    const rootDir = createFixture({
      'src/view.ts': [
        "import { MyComponent } from './component';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: \"'; alert(1)//\", component: MyComponent })",
        'class InjectionView {}',
      ].join('\n'),
      'src/component.ts': 'export const MyComponent = {};',
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/must start with a letter/);
  });

  it('rejects id longer than 64 characters', () => {
    const rootDir = createFixture({
      'src/view.ts': [
        "import { MyComponent } from './component';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        '@View({ id: \'' + 'a'.repeat(65) + '\', component: MyComponent })',
        'class LongIdView {}',
      ].join('\n'),
      'src/component.ts': 'export const MyComponent = {};',
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/must be 64 characters or less/);
  });

  // SC-02: anchorSelector validation tests
  it('rejects anchorSelector longer than 256 characters', () => {
    const rootDir = createFixture({
      'src/view.ts': [
        "import { MyComponent } from './component';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        '@View({ id: \'myview\', component: MyComponent, anchorSelector: \'' + '#'.repeat(257) + '\' })',
        'class LongAnchorView {}',
      ].join('\n'),
      'src/component.ts': 'export const MyComponent = {};',
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/must be 256 characters or less/);
  });

  it('rejects anchorSelector with unsafe url() CSS function', () => {
    const rootDir = createFixture({
      'src/view.ts': [
        "import { MyComponent } from './component';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: 'myview', component: MyComponent, anchorSelector: 'body { background: url(https://evil.com/track)' })",
        'class UnsafeAnchorView {}',
      ].join('\n'),
      'src/component.ts': 'export const MyComponent = {};',
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/contains unsafe CSS functions/);
  });

  it('rejects anchorSelector with expression() CSS function', () => {
    const rootDir = createFixture({
      'src/view.ts': [
        "import { MyComponent } from './component';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: 'myview', component: MyComponent, anchorSelector: 'body { color: expression(alert(1))' })",
        'class ExprAnchorView {}',
      ].join('\n'),
      'src/component.ts': 'export const MyComponent = {};',
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).toThrow(/contains unsafe CSS functions/);
  });

  it('accepts valid id and anchorSelector', () => {
    const rootDir = createFixture({
      'src/component.ts': 'export const MyComponent = {};',
      'src/view.ts': [
        "import { MyComponent } from './component';",
        'function View(opts: any): ClassDecorator { return (t) => t; }',
        "@View({ id: 'my-view', component: MyComponent, anchorSelector: '#container' })",
        'class ValidView {}',
      ].join('\n'),
    });

    const run = scanFirstClass(rootDir, 'src/view.ts');
    expect(run).not.toThrow();
    const metadata = run();
    expect(metadata).not.toBeNull();
    expect(metadata?.id).toBe('my-view');
    expect(metadata?.anchorSelector).toBe('#container');
  });

  // Existing import path tests
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

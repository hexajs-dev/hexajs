import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { evalNode } from '../src/compiler/shared/props.methods';

function createProgram(source: string): { checker: ts.TypeChecker; sourceFile: ts.SourceFile } {
  const filePath = '/test.ts';
  const host = ts.createCompilerHost({ target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext });
  const originalGetSourceFile = host.getSourceFile;

  host.getSourceFile = (name, languageVersion) => {
    if (name === filePath) {
      return ts.createSourceFile(filePath, source, languageVersion, true, ts.ScriptKind.TS);
    }

    return originalGetSourceFile.call(host, name, languageVersion);
  };

  host.fileExists = (name) => name === filePath || ts.sys.fileExists(name);
  host.readFile = (name) => (name === filePath ? source : ts.sys.readFile(name));

  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
  }, host);

  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) {
    throw new Error('Could not load source file.');
  }

  return { checker: program.getTypeChecker(), sourceFile };
}

function getVariableInitializer(sourceFile: ts.SourceFile, variableName: string): ts.Expression {
  let initializer: ts.Expression | null = null;

  ts.forEachChild(sourceFile, node => {
    if (!ts.isVariableStatement(node) || initializer) {
      return;
    }

    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === variableName && declaration.initializer) {
        initializer = declaration.initializer;
        return;
      }
    }
  });

  if (!initializer) {
    throw new Error(`Variable initializer not found for ${variableName}.`);
  }

  return initializer;
}

function buildReferenceChain(length: number): string {
  const lines = [`const T0 = 'ok';`];
  for (let i = 1; i <= length; i++) {
    lines.push(`const T${i} = T${i - 1};`);
  }
  lines.push(`const value = T${length};`);
  return lines.join('\n');
}

describe('props.methods security', () => {
  it('returns undefined for cyclic symbol references without throwing', () => {
    const source = [
      'const A = B;',
      'const B = A;',
      'const value = A;',
    ].join('\n');
    const { checker, sourceFile } = createProgram(source);
    const initializer = getVariableInitializer(sourceFile, 'value');

    expect(() => evalNode(checker, initializer)).not.toThrow();
    expect(evalNode(checker, initializer)).toBeUndefined();
  });

  it('resolves finite chains within the recursion limit', () => {
    const { checker, sourceFile } = createProgram(buildReferenceChain(10));
    const initializer = getVariableInitializer(sourceFile, 'value');

    expect(evalNode(checker, initializer)).toBe('ok');
  });

  it('short-circuits deep chains beyond the recursion limit', () => {
    const { checker, sourceFile } = createProgram(buildReferenceChain(40));
    const initializer = getVariableInitializer(sourceFile, 'value');

    expect(() => evalNode(checker, initializer)).not.toThrow();
    expect(evalNode(checker, initializer)).toBeUndefined();
  });
});

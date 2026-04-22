import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

interface HexaServiceMetadata {
  injectable: true;
  context: string;
}

interface HexaMetadata {
  [className: string]: HexaServiceMetadata;
}

const srcDir = path.resolve(__dirname, '../src');
const outFile = path.resolve(__dirname, '../dist/hexa-metadata.json');

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findTsFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) results.push(full);
  }
  return results;
}

function getDecoratorName(decorator: ts.Decorator): string | null {
  const expr = decorator.expression;
  if (ts.isCallExpression(expr)) {
    const id = expr.expression;
    if (ts.isIdentifier(id)) return id.text;
  }
  if (ts.isIdentifier(expr)) return expr.text;
  return null;
}

function getInjectableContext(decorator: ts.Decorator): string | null {
  const expr = decorator.expression;
  if (!ts.isCallExpression(expr) || expr.arguments.length === 0) return null;
  const arg = expr.arguments[0];
  if (!ts.isObjectLiteralExpression(arg)) return null;
  const contextProp = arg.properties.find(p => ts.isIdentifier(p.name!) && p.name.text === 'context');
  if (!contextProp || !ts.isPropertyAssignment(contextProp)) return null;
  const val = contextProp.initializer;
  // Handles InjectableContext.Background / InjectableContext.Content / etc.
  if (ts.isPropertyAccessExpression(val)) return val.name.text.toLowerCase();
  if (ts.isStringLiteral(val)) return val.text.toLowerCase();
  return null;
}

function scan(): HexaMetadata {
  const files = findTsFiles(srcDir);
  const program = ts.createProgram(files, { target: ts.ScriptTarget.ES2020, experimentalDecorators: true });
  const metadata: HexaMetadata = {};

  // Recursive visitor to find all classes, even nested ones
  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && node.name) {
      const decorators = ts.getDecorators(node);
      if (decorators) {
        const injectable = decorators.find(d => getDecoratorName(d) === 'Injectable');
        if (injectable) {
          const context = getInjectableContext(injectable) ?? 'general';
          metadata[node.name.text] = { injectable: true, context };
        }
      }
    }
    // Recursively visit all child nodes
    ts.forEachChild(node, visit);
  }

  for (const sourceFile of program.getSourceFiles()) {
    if (!files.includes(sourceFile.fileName)) continue;
    visit(sourceFile);
  }

  return metadata;
}

const metadata = scan();
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(metadata, null, 2));
console.log(`[hexa] metadata written → ${outFile}`);
console.log(metadata);

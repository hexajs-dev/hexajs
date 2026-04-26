import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import type { Plugin } from 'vite';
import { HEXA_METADATA_HMAC_KEY } from '../src/constants';

interface HexaServiceMetadata {
  injectable: true;
  context: string;
}

interface HexaMetadata {
  [className: string]: HexaServiceMetadata;
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
  if (ts.isPropertyAccessExpression(val)) return val.name.text.toLowerCase();
  if (ts.isStringLiteral(val)) return val.text.toLowerCase();
  return null;
}

function findTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

function scanMetadata(srcDir: string): HexaMetadata {
  const files = findTsFiles(srcDir);
  console.log(`[hexa-metadata] Found ${files.length} TypeScript files in ${srcDir}`);

  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2020,
    experimentalDecorators: true,
    moduleResolution: ts.ModuleResolutionKind.Node10
  });

  const metadata: HexaMetadata = {};
  let classCount = 0;
  let decoratedCount = 0;
  let filesProcessed = 0;

  console.log('[hexa-metadata] Processing source files...');
  for (const sourceFile of program.getSourceFiles()) {
    const normalizedFileName = sourceFile.fileName.replace(/\\/g, '/');
    const normalizedFiles = files.map(f => f.replace(/\\/g, '/'));

    if (!normalizedFiles.includes(normalizedFileName)) {
      continue;
    }

    filesProcessed++;
    console.log(`[hexa-metadata]  Processing: ${path.basename(sourceFile.fileName)}`);

    function visit(node: ts.Node) {
      if (ts.isClassDeclaration(node) && node.name) {
        classCount++;

        const decorators = ts.getDecorators?.(node) || (node as any).decorators;
        if (!decorators || decorators.length === 0) {
          return;
        }

        decoratedCount++;
        const injectable = decorators.find((d: ts.Decorator) => getDecoratorName(d) === 'Injectable');
        if (!injectable) {
          console.log(`[hexa-metadata]   - ${node.name.text} has decorators but not @Injectable`);
          return;
        }

        const context = getInjectableContext(injectable) ?? 'general';
        metadata[node.name.text] = { injectable: true, context };
        console.log(`[hexa-metadata]   ✓ ${node.name.text} (${context})`);
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  }

  console.log(`[hexa-metadata] Files processed: ${filesProcessed}, Classes found: ${classCount}, Decorated: ${decoratedCount}`);
  return metadata;
}

export function hexaMetadataPlugin(): Plugin {
  let root: string;

  return {
    name: 'hexa-metadata',

    configResolved(config) {
      root = config.root;
    },

    closeBundle() {
      const srcDir = path.resolve(root, 'src');
      const outFile = path.resolve(root, 'dist/hexa-metadata.json');

      console.log('[hexa-metadata] Scanning source files...');
      const metadata = scanMetadata(srcDir);

      const metadataJson = JSON.stringify(metadata);
      const hmac = crypto.createHmac('sha256', HEXA_METADATA_HMAC_KEY);
      hmac.update(metadataJson, 'utf8');
      const signature = hmac.digest('hex');

      const signedOutput = JSON.stringify({ v: 1, signature, metadata }, null, 2);

      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, signedOutput);

      console.log(`[hexa-metadata] ✓ Generated and signed metadata for ${Object.keys(metadata).length} services`);
      console.log(`[hexa-metadata] → ${outFile}`);
    }
  };
}
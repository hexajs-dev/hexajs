import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { HexaConfig } from '../src/bin/config/config';
import { resolveConfig } from '../src/bin/config/resolve';
import { DIScanner } from '../src/compiler/di/scanner';
import { HexaContext } from '../src/compiler/di/types';
import { MetadataRegistry } from '../src/compiler/registry';
import { buildDependencyArgs } from '../src/generators/shared/dependency-args';
import { generateTokenRegistrations } from '../src/generators/shared/tokens';

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

  return ts.createProgram(fileNames, { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.NodeJs, experimentalDecorators: true }, host);
}

function createConfig(tokens: HexaConfig['tokens']): HexaConfig {
  return {
    $schema: './node_modules/@hexajs-dev/cli/schema/hexa-cli.schema.json',
    project: {
      name: 'fixture',
      version: '1.0.0',
      sourceRoot: 'src',
    },
    compilerOptions: {
      tsConfig: 'tsconfig.json',
      assets: [],
      minify: false,
      cssMinify: false,
      sourceMap: true,
      terserOptions: {},
    },
    tokens,
    ui: { parallelBuild: true },
    environments: {
      production: {
        platforms: {
          chrome: {
            outDir: 'dist/chrome',
            manifest: 'manifest.chrome.json',
          },
        },
      },
    },
    defaultMode: 'production',
    defaultPlatform: 'chrome',
  };
}

describe('token key security', () => {
  it('emits token registration keys as safe JSON string literals', () => {
    const output = generateTokenRegistrations([
      { key: "api'key\nline", value: 'value' },
    ] as any);

    expect(output).toContain('container.register("api\'key\\nline", () => "value");');
    expect(output).not.toContain("container.register('api'key");
  });

  it('emits token dependency args as safe JSON string literals', () => {
    const output = buildDependencyArgs({
      dependencies: [],
      tokenDependencies: [{ paramIndex: 0, tokenKey: "safe'key" }],
    });

    expect(output).toBe('container.resolve("safe\'key")');
  });

  it('rejects invalid createToken keys during scanner pass', () => {
    const program = createProgramFromFiles({
      '/test.ts': `const token = createToken('BAD KEY', 'value');`,
    });
    const checker = program.getTypeChecker();
    const scanner = new DIScanner(checker, false);
    const sourceFile = program.getSourceFile('/test.ts');

    if (!sourceFile) {
      throw new Error('Could not load source file.');
    }

    expect(() => {
      ts.forEachChild(sourceFile, node => {
        scanner.scanToken(node);
      });
    }).toThrow(/invalid token key/i);
  });

  it('rejects invalid token keys in config resolution', () => {
    const config = createConfig([{ key: 'BAD KEY', value: 'x' } as any]);

    expect(() => resolveConfig(config, 'chrome', 'production')).toThrow(/invalid token key/i);
  });

  it('rejects invalid token keys in metadata registry', () => {
    const registry = new MetadataRegistry();

    expect(() => registry.addToken({
      key: 'BAD KEY',
      defaultValue: 'value',
      context: HexaContext.General,
      importPath: '/fixture.ts',
    })).toThrow(/invalid token key/i);
  });
});

import { describe, expect, it } from 'vitest';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { build } from 'vite';

async function buildRuntimeBundleForPlatform(platform: string): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), 'hexa-ports-tree-shake-'));
  const entryPath = join(rootDir, 'entry.ts');
  const outputDir = join(rootDir, 'dist');

  const runtimePortPath = resolve(process.cwd(), 'src/general/runtime/runtime.port.ts').replace(/\\/g, '/');

  await writeFile(entryPath, `import { RuntimePort } from '${runtimePortPath}';\nexport async function probe(message: unknown): Promise<unknown> {\n  const runtime = new RuntimePort('${platform}');\n  return runtime.sendMessage(message);\n}\n`, 'utf8');

  await build({
    configFile: false,
    logLevel: 'silent',
    resolve: {
      alias: {
        '@hexajs-dev/common': resolve(process.cwd(), '../common/index.ts'),
      },
    },
    define: {
      __HEXA_PLATFORM__: JSON.stringify(platform),
    },
    build: {
      lib: {
        entry: entryPath,
        formats: ['es'],
        fileName: () => 'bundle.js',
        name: 'RuntimeTreeShakingProbe',
      },
      minify: 'esbuild',
      outDir: outputDir,
      emptyOutDir: true,
      sourcemap: false,
      target: 'es2020',
    },
  });

  const outputFiles = await readdir(outputDir);
  const jsFiles = outputFiles.filter((fileName) => fileName.endsWith('.js'));
  const outputs = await Promise.all(jsFiles.map((fileName) => readFile(join(outputDir, fileName), 'utf8')));
  const output = outputs.join('\n');
  await rm(rootDir, { recursive: true, force: true });

  return output;
}

describe('RuntimePort compile-time tree shaking', () => {
  it('emits build-specific platform constants that enable downstream tree-shaking', async () => {
    const firefoxBundle = await buildRuntimeBundleForPlatform('firefox');
    const chromeBundle = await buildRuntimeBundleForPlatform('chrome');

    expect(firefoxBundle).toMatch(/switch\s*\(\s*"firefox"\s*\)/);
    expect(chromeBundle).toMatch(/switch\s*\(\s*"chrome"\s*\)/);
    expect(firefoxBundle).not.toContain('switch(typeof __HEXA_PLATFORM__!=="undefined"?__HEXA_PLATFORM__:this.platform)');
    expect(chromeBundle).not.toContain('switch(typeof __HEXA_PLATFORM__!=="undefined"?__HEXA_PLATFORM__:this.platform)');
    expect(firefoxBundle).not.toEqual(chromeBundle);
  }, 20000);
});

import { defineConfig } from 'tsup';
import * as fs from 'fs/promises';
import * as path from 'path';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'bin/hexa': 'src/bin/hexa.ts',
  },
  format: ['cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: true,
  outDir: 'dist',
  onSuccess: async () => {
    // Copy and update package.json to dist folder
    const pkgData = await fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(pkgData);

    // Update paths to be relative to dist folder
    pkg.main = 'index.js';
    pkg.types = 'index.d.ts';
    pkg.bin = { hexa: 'bin/hexa.js' };

    // Remove unnecessary fields
    delete pkg.scripts;
    delete pkg.devDependencies;

    await fs.writeFile('dist/package.json', JSON.stringify(pkg, null, 2));

    const schemaSourcePath = path.join('src', 'bin', 'config', 'hexa-cli.schema.json');
    const schemaRelativePath = path.join('schema', 'hexa-cli.schema.json');
    const schemaDistDir = path.join('dist', 'schema');
    const schemaDistPath = path.join(schemaDistDir, 'hexa-cli.schema.json');
    await fs.mkdir(path.dirname(schemaRelativePath), { recursive: true });
    await fs.mkdir(schemaDistDir, { recursive: true });
    await fs.copyFile(schemaSourcePath, schemaRelativePath);
    await fs.copyFile(schemaSourcePath, schemaDistPath);

    console.log('✓ Copied and updated package.json to dist');
    console.log('✓ Copied schema to schema/hexa-cli.schema.json');
    console.log('✓ Copied schema to dist/schema/hexa-cli.schema.json');
  },
});

import { defineConfig } from 'tsup';
import * as fs from 'fs/promises';

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
    console.log('✓ Copied and updated package.json to dist');
  },
});

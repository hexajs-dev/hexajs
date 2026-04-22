import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { hexaMetadataPlugin } from '@hexajs/common/scripts/vite-plugin-hexa-metadata';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'HexaJS',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs'
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ['@hexajs/common', '@hexajs/ports', /^@hexajs\/common\//, /^@hexajs\/ports\//, 'rxjs', /^rxjs\//],
      output: {
        preserveModules: true,
        preserveModulesRoot: '.',
        exports: 'named'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  plugins: [
    // Generate TypeScript declaration files
    dts({
      include: ['src/**/*.ts', 'index.ts'],
      exclude: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
      outDir: 'dist',
      rollupTypes: false,
      insertTypesEntry: true
    }),
    // Generate hexa-metadata.json
    hexaMetadataPlugin()
  ]
});

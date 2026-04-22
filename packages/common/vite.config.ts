import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'HexaJSCommon',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs'
    },
    rollupOptions: {
      external: ['reflect-metadata'],
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
    dts({
      include: ['src/**/*', 'index.ts'],
      outDir: 'dist',
      rollupTypes: false,
      insertTypesEntry: true
    })
  ]
});

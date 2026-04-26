import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { hexaMetadataPlugin } from '../common/scripts/vite-plugin-hexa-metadata';

const shouldEmitDeclarationMaps = process.env.HEXA_DECLARATION_MAP === 'true';
const shouldEmitSourceMaps = process.env.HEXA_PACKAGE_SOURCEMAP === 'true';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'HexaJSPorts',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs'
    },
    rollupOptions: {
      external: ['@hexajs/common'],
      output: {
        preserveModules: true,
        preserveModulesRoot: '.',
        exports: 'named'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: shouldEmitSourceMaps
  },
  plugins: [
    dts({
      include: ['src/**/*', 'index.ts', 'hexa.web.ext.d.ts'],
      outDir: 'dist',
      rollupTypes: false,
      insertTypesEntry: true,
      copyDtsFiles: true,
      compilerOptions: {
        types: ['./hexa.web.ext.d.ts'],
        declarationMap: shouldEmitDeclarationMaps,
      }
    }),
    hexaMetadataPlugin()
  ]
});

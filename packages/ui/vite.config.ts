import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { hexaMetadataPlugin } from '@hexajs/common/scripts/vite-plugin-hexa-metadata';

const HEXA_EXTERNALS = [
  '@hexajs/common',
  '@hexajs/core',
  '@hexajs/ports',
  /^@hexajs\//,
];

const NODE_EXTERNALS = [
  'vite',
  'fs',
  'path',
  'module',
  'os',
  'url',
  'child_process',
  /^node:/,
];

const BROWSER_EXTERNALS = [
  'react',
  'react-dom',
  'react-dom/client',
  /^react\//,
  /^react-dom\//,
];

export default defineConfig({
  build: {
    lib: {
      // Two entries: browser runtime (services) and Node.js build tools (popup/devtools builders)
      entry: {
        index: resolve(__dirname, 'index.ts'),
        browser: resolve(__dirname, 'src/services/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        format === 'es' ? `${entryName}.js` : `${entryName}.cjs`,
    },
    rollupOptions: {
      external: [
        ...HEXA_EXTERNALS,
        ...NODE_EXTERNALS,
        ...BROWSER_EXTERNALS,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: '.',
        exports: 'named',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts', 'index.ts'],
      outDir: 'dist',
      rollupTypes: false,
      insertTypesEntry: true,
    }),
    hexaMetadataPlugin(),
  ],
});

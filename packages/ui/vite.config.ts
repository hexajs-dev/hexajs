import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { hexaMetadataPlugin } from '../common/scripts/vite-plugin-hexa-metadata';

const shouldEmitSourceMaps = process.env.HEXA_PACKAGE_SOURCEMAP === 'true';

const HEXA_EXTERNALS = [
  '@hexajs-dev/common',
  '@hexajs-dev/core',
  '@hexajs-dev/ports',
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
  'vue',
  /^@vue\//,
];

export default defineConfig({
  build: {
    lib: {
      // Entries:
      //  - index    : full package surface (Node-side build helpers + browser
      //               services). Re-exports remain for backwards compat.
      //  - browser  : aggregated browser-side services (pre-existing).
      //  - react    : React-only browser entry (./react subpath).
      //  - vue      : Vue-only browser entry (./vue subpath).
      entry: {
        index: resolve(__dirname, 'index.ts'),
        browser: resolve(__dirname, 'src/services/index.ts'),
        react: resolve(__dirname, 'src/services/react.ts'),
        vue: resolve(__dirname, 'src/services/vue.ts'),
        client: resolve(__dirname, 'src/services/client.ts'),
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
    sourcemap: shouldEmitSourceMaps,
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

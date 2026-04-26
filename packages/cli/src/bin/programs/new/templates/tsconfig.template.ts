import type { ScaffoldContext } from '../models/scaffold.types';

export const tsconfigTemplate = (_ctx: ScaffoldContext): string =>
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        jsx: 'react-jsx',
        moduleResolution: 'bundler',
        strict: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
        skipLibCheck: true,
        types: ['@hexajs-dev/ports/hexa.web.ext'],
        outDir: './dist',
        rootDir: './src',
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  );

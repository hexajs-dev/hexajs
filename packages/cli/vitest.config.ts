import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const workspacePackageAliases = {
  '@hexajs-dev/common': resolve(__dirname, '../common/index.ts'),
  '@hexajs-dev/core': resolve(__dirname, '../core/index.ts'),
  '@hexajs-dev/ports': resolve(__dirname, '../ports/index.ts'),
  '@hexajs-dev/ui': resolve(__dirname, '../ui/index.ts'),
};

export default defineConfig({
  resolve: {
    alias: workspacePackageAliases,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
  },
});

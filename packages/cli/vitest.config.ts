import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const workspacePackageAliases = {
  '@hexajs/common': resolve(__dirname, '../common/index.ts'),
  '@hexajs/core': resolve(__dirname, '../core/index.ts'),
  '@hexajs/ports': resolve(__dirname, '../ports/index.ts'),
  '@hexajs/ui': resolve(__dirname, '../ui/index.ts'),
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

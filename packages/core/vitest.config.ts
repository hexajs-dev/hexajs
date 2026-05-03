import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const workspacePackageAliases = {
    '@hexajs-dev/common': resolve(__dirname, '../common/index.ts'),
    '@hexajs-dev/ports': resolve(__dirname, '../ports/index.ts'),
};

export default defineConfig({
    resolve: {
        alias: workspacePackageAliases,
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
    },
});

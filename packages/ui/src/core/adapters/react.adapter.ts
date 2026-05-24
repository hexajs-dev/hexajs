import type { Plugin } from 'vite';
import type { UiFrameworkAdapter } from '../framework-adapter';
import { loadReactPlugin } from '../react-plugin';

/**
 * React adapter — the default UI framework for HexaJS managed UI.
 *
 * Wraps the existing `loadReactPlugin` helper so the adapter contract is the
 * single point of reference for framework-specific knowledge in the managed
 * UI pipeline. Importing this module does not pull React in itself; the user
 * project is expected to depend on `react`, `react-dom`, and
 * `@vitejs/plugin-react`.
 */
export const reactAdapter: UiFrameworkAdapter = {
  name: 'react',
  vitePluginPackage: '@vitejs/plugin-react',
  loadVitePlugin(cwd: string): Plugin | Plugin[] {
    const fn = loadReactPlugin(cwd);
    return fn();
  },
  shadowRendererImport: {
    module: '@hexajs-dev/ui/react',
    exportName: 'ReactShadowRenderer',
  },
  componentExtensions: ['.tsx', '.jsx'] as const,
  dedupe: ['react', 'react-dom'] as const,
};

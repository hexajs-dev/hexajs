import type { Plugin } from 'vite';
import type { UiFrameworkAdapter } from '../framework-adapter';
import { loadVuePlugin } from '../vue-plugin';

/**
 * Vue adapter — uses Vue 3 single-file components compiled by
 * `@vitejs/plugin-vue`. Mounts components inside shadow DOM via the Vue
 * counterpart of ReactShadowRenderer (`VueShadowRenderer`).
 *
 * Importing this module does not pull `vue` itself; the user project is
 * expected to depend on `vue` and `@vitejs/plugin-vue`.
 */
export const vueAdapter: UiFrameworkAdapter = {
  name: 'vue',
  vitePluginPackage: '@vitejs/plugin-vue',
  loadVitePlugin(cwd: string): Plugin | Plugin[] {
    const fn = loadVuePlugin(cwd);
    return fn();
  },
  shadowRendererImport: {
    module: '@hexajs-dev/ui/vue',
    exportName: 'VueShadowRenderer',
  },
  componentExtensions: ['.vue'] as const,
  dedupe: ['vue'] as const,
};

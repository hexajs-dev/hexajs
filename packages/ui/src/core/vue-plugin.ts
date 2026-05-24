import { createRequire } from 'module';
import * as path from 'path';
import type { Plugin } from 'vite';

export type VuePluginFn = (...args: unknown[]) => Plugin | Plugin[];

/**
 * Resolve `@vitejs/plugin-vue` from the **user's** project at build time.
 * The Hexa packages never own framework plugins — they must live in the
 * user project's node_modules.
 *
 * Throws a precise, actionable error message when the plugin (or `vue`) is
 * missing, naming the install command the user should run.
 */
export function loadVuePlugin(cwd: string): VuePluginFn {
  const userRequire = createRequire(path.join(cwd, 'package.json'));
  try {
    const mod = userRequire('@vitejs/plugin-vue') as
      | { default?: VuePluginFn }
      | VuePluginFn;
    const fn = typeof mod === 'function' ? mod : (mod as { default: VuePluginFn }).default;
    if (typeof fn !== 'function') {
      throw new Error('@vitejs/plugin-vue did not export a callable function');
    }
    return fn;
  } catch (e) {
    throw new Error(
      `'@vitejs/plugin-vue' is not installed in your project.\n` +
        `Run: pnpm add -D @vitejs/plugin-vue vue\n` +
        `(${e})`
    );
  }
}

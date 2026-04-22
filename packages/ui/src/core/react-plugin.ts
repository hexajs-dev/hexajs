import { createRequire } from 'module';
import * as path from 'path';
import type { Plugin } from 'vite';

export type ReactPluginFn = (...args: unknown[]) => Plugin | Plugin[];

/**
 * Resolve `@vitejs/plugin-react` from the **user's** project at build time.
 * The Hexa packages never own framework plugins — they must live in the
 * user project's node_modules.
 */
export function loadReactPlugin(cwd: string): ReactPluginFn {
  const userRequire = createRequire(path.join(cwd, 'package.json'));
  try {
    const mod = userRequire('@vitejs/plugin-react') as
      | { default?: ReactPluginFn }
      | ReactPluginFn;
    const fn = typeof mod === 'function' ? mod : (mod as { default: ReactPluginFn }).default;
    if (typeof fn !== 'function') {
      throw new Error('@vitejs/plugin-react did not export a callable function');
    }
    return fn;
  } catch (e) {
    throw new Error(
      `'@vitejs/plugin-react' is not installed in your project.\n` +
        `Run: pnpm add -D @vitejs/plugin-react\n` +
        `(${e})`
    );
  }
}

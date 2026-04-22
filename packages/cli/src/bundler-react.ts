import { createRequire } from 'module';
import * as path from 'path';
import type { Plugin } from 'vite';

type ReactPluginFn = (...args: unknown[]) => Plugin | Plugin[];

/**
 * Attempt to load @vitejs/plugin-react from the user's project.
 * Returns the plugin instance, or null if not installed.
 */
export function loadReactPlugin(cwd: string): Plugin | Plugin[] | null {
  const userRequire = createRequire(path.join(cwd, 'package.json'));
  try {
    const mod = userRequire('@vitejs/plugin-react') as { default?: ReactPluginFn } | ReactPluginFn;
    const fn = typeof mod === 'function' ? mod : (mod as { default: ReactPluginFn }).default;
    if (typeof fn !== 'function') return null;
    return fn();
  } catch {
    return null;
  }
}

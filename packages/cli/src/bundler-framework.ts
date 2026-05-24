import { createRequire } from 'module';
import * as path from 'path';
import type { Plugin } from 'vite';

export type UiFrameworkName = 'react' | 'vue';

export interface FrameworkPluginInfo {
  /** The package name being resolved (e.g. '@vitejs/plugin-react'). */
  pluginPackage: string;
  /** Loaded plugin instance(s) ready to pass to Vite. */
  plugin: Plugin | Plugin[];
}

const FRAMEWORK_PLUGIN_PACKAGES: Record<UiFrameworkName, string> = {
  react: '@vitejs/plugin-react',
  vue: '@vitejs/plugin-vue',
};

type PluginFactory = (...args: unknown[]) => Plugin | Plugin[];

/**
 * Attempt to load the given framework's Vite plugin from the user's project.
 * Returns the loaded plugin (and the package name attempted) or null when the
 * plugin is not installed. The CLI prints a single warning and degrades the
 * @View bundle when the plugin is missing.
 */
export function loadFrameworkPlugin(cwd: string, framework: UiFrameworkName = 'react'): FrameworkPluginInfo | null {
  const pluginPackage = FRAMEWORK_PLUGIN_PACKAGES[framework];
  if (!pluginPackage) {
    return null;
  }

  const userRequire = createRequire(path.join(cwd, 'package.json'));
  try {
    const mod = userRequire(pluginPackage) as { default?: PluginFactory } | PluginFactory;
    const fn = typeof mod === 'function' ? mod : (mod as { default: PluginFactory }).default;
    if (typeof fn !== 'function') {
      return null;
    }
    return { pluginPackage, plugin: fn() };
  } catch {
    return null;
  }
}

/**
 * @deprecated Use `loadFrameworkPlugin(cwd, 'react')` instead. Retained for
 * backwards compatibility within the CLI.
 */
export function loadReactPlugin(cwd: string): Plugin | Plugin[] | null {
  const result = loadFrameworkPlugin(cwd, 'react');
  return result?.plugin ?? null;
}

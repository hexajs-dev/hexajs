import type { Plugin } from 'vite';
import { reactAdapter } from './adapters/react.adapter';
import { vueAdapter } from './adapters/vue.adapter';

/**
 * Names of UI frameworks supported by HexaJS managed UI.
 *
 * Adding a new framework (e.g. 'svelte') requires:
 *  - A new adapter implementation in src/core/adapters/<name>.adapter.ts
 *  - A new shadow renderer service exposed at @hexajs-dev/ui/<name>
 *  - Registration in `getAdapter()` registry below
 *  - Scaffold templates and a hexa new prompt branch in @hexajs-dev/cli
 *
 * See documentation/docs/contributing/adding-frameworks.md for the full contract.
 */
export type UiFrameworkName = 'react' | 'vue';

/**
 * Description of where a framework's ShadowRenderer lives, used by the CLI's
 * @View generator to emit the correct import + mount call site.
 */
export interface ShadowRendererImport {
  /** Public package subpath, e.g. '@hexajs-dev/ui/react'. */
  module: string;
  /** Named export to use, e.g. 'ReactShadowRenderer'. */
  exportName: string;
}

/**
 * The contract every UI-framework integration must implement.
 *
 * The adapter centralises framework-specific knowledge so the rest of the
 * managed UI pipeline (popup/devtools/newtab builders, content @View bundler,
 * scaffold templates, etc.) can stay framework-agnostic.
 */
export interface UiFrameworkAdapter {
  /** Internal identifier used to look the adapter up in the registry. */
  name: UiFrameworkName;
  /**
   * Name of the Vite plugin package the adapter requires in the user project,
   * e.g. '@vitejs/plugin-react' or '@vitejs/plugin-vue'. Used in error messages
   * and warnings when the plugin is missing.
   */
  vitePluginPackage: string;
  /**
   * Resolve and instantiate the framework's Vite plugin from the user's
   * project. Must throw a clear error when the plugin is missing.
   */
  loadVitePlugin(cwd: string): Plugin | Plugin[];
  /**
   * The CLI uses this to know where to import the ShadowRenderer from
   * when generating the content bootstrap for @View decorators.
   */
  shadowRendererImport: ShadowRendererImport;
  /**
   * Component file extensions associated with the framework, e.g. ['.tsx']
   * for React or ['.vue'] for Vue. Reserved for future tooling.
   */
  componentExtensions: readonly string[];
  /**
   * Module names that must be deduplicated to a single instance during the
   * managed UI build, e.g. ['react', 'react-dom'] for React or ['vue'] for Vue.
   * Forwarded into Vite's `resolve.dedupe`.
   */
  dedupe: readonly string[];
}

/**
 * Eagerly-registered adapters. Each adapter file is intentionally tiny (it
 * only declares a constant referencing the framework's plugin loader and
 * shadow renderer subpath) so the static import here does not pull in the
 * framework runtime itself — that lives behind the loader.
 */
const adapters: Record<UiFrameworkName, UiFrameworkAdapter> = {
  react: reactAdapter,
  vue: vueAdapter,
};

const adapterCache = new Map<UiFrameworkName, UiFrameworkAdapter>();

/**
 * Look up an adapter by framework name. Throws a clear, typed error for
 * unsupported framework names so future contributors see exactly where to
 * register a new framework.
 */
export function getAdapter(name: UiFrameworkName | string): UiFrameworkAdapter {
  const cached = adapterCache.get(name as UiFrameworkName);
  if (cached) {
    return cached;
  }

  const adapter = adapters[name as UiFrameworkName];
  if (!adapter) {
    const supported = Object.keys(adapters).join(', ');
    throw new Error(
      `[HexaJS] Unsupported UI framework "${name}". Supported frameworks: ${supported}.\n` +
      `To add a new framework, follow the adapter contract documented at ` +
      `documentation/docs/contributing/adding-frameworks.md.`
    );
  }

  adapterCache.set(name as UiFrameworkName, adapter);
  return adapter;
}

/** Test-only helper: clears the lazy adapter cache. */
export function __resetAdapterCacheForTests(): void {
  adapterCache.clear();
}

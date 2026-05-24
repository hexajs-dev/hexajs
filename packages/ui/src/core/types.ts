export type HexaUiSurface = 'popup' | 'devtools' | 'newtab';

export type HexaUiMode = 'managed' | 'external' | 'none';

export type HexaUiFrameworkName = 'react' | 'vue';

export interface HexaUiSurfaceConfig {
  mode?: HexaUiMode;
  /** Source directory for managed builds (relative to project root) */
  sourceDir?: string;
  /** Pre-built dist directory for external mode */
  distDir?: string;
  /** Entry HTML file name, e.g. "index.html" */
  indexFile?: string;
  /** Optional name to a Vite config file for this surface (only for managed mode) */
  viteConfig?: string;
}

export interface HexaUiCompilerOptions {
  minify: false | 'esbuild' | 'terser';
  cssMinify: boolean | 'esbuild' | 'lightningcss';
  sourceMap: boolean | 'inline' | 'hidden';
  terserOptions: Record<string, unknown>;
}

export interface HexaUiConfig {
  /** Project-wide UI framework. Defaults to 'react' for backwards compatibility. */
  framework?: HexaUiFrameworkName;
  popup?: HexaUiSurfaceConfig;
  devtools?: HexaUiSurfaceConfig;
  newtab?: HexaUiSurfaceConfig;
}

/** Resolved output paths for each UI surface, written into the extension manifest */
export interface ManifestUiEntries {
  popup?: string;
  devtools?: string;
  newtab?: string;
}

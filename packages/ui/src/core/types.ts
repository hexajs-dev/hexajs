export type HexaUiSurface = 'popup' | 'devtools';

export type HexaUiMode = 'managed' | 'external' | 'none';

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
  popup?: HexaUiSurfaceConfig;
  devtools?: HexaUiSurfaceConfig;
}

/** Resolved output paths for each UI surface, written into the extension manifest */
export interface ManifestUiEntries {
  popup?: string;
  devtools?: string;
}

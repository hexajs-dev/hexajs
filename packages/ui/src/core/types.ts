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
  /** Shell command to run before copying (external mode only) */
  buildCommand?: string;
  /** Optional name to a Vite config file for this surface (only for managed mode) */
  viteConfig?: string;
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

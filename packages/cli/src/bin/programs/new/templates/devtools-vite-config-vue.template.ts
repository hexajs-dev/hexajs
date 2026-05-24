/** Project Vite config for the Vue managed devtools — HexaJS injects @vitejs/plugin-vue. */
export const devtoolsViteConfigVueTemplate = (): string => `import path from 'path';
import { defineConfig } from 'vite';

// ─────────────────────────────────────────────────────────────────────────────
// HexaJS automatically injects the framework plugin (e.g. @vitejs/plugin-vue)
// into the build pipeline. You do NOT need to add it here — if it is detected
// in this file it will be skipped to avoid loading the plugin twice.
//
// Use this file to extend the Vite config with project-specific settings,
// for example: path aliases, additional plugins, or custom build options.
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  resolve: {
    alias: {
      // '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      // localsConvention: 'camelCase',
    },
  },
  define: {
    // 'import.meta.env.EXTENSION_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  plugins: [
    // add extra plugins here (framework plugin is injected by HexaJS)
  ],
});
`;

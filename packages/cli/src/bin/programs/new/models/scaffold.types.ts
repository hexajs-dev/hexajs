import type { PackageManager } from '../../../../shared/package-manager';

export interface ScaffoldContext {
  /** Raw project name, e.g. "my-cool-ext" */
  name: string;
  /** PascalCase class name prefix derived from name, e.g. "MyCoolExt" */
  className: string;
  /** Selected target platforms, e.g. ["chrome", "firefox"] */
  platforms: string[];
  /**
   * UI framework used by all managed surfaces. Only meaningful when at least
   * one managed surface is selected. Defaults to 'react'.
   */
  framework: 'react' | 'vue';
  /** Whether to scaffold and configure a managed popup (now framework-aware) */
  reactPopup: boolean;
  /** Whether to scaffold and configure a managed devtools panel */
  managedDevtools: boolean;
  /**
   * Whether to scaffold the devtools panel with the chosen framework
   * (requires managedDevtools). Mirrors the legacy `reactDevtools` flag for
   * backwards compatibility with existing call sites.
   */
  reactDevtools: boolean;
  /** Whether to scaffold and configure a managed new tab page */
  managedNewtab: boolean;
  /** Whether to scaffold a minimal blank project (no store, no services, no contract demo) */
  blank: boolean;
  /** Selected package manager, used to set packageManager metadata in package.json */
  packageManager: PackageManager;
  /** Selected package manager version used in package.json (e.g. "10.9.0") */
  packageManagerVersion: string;
}

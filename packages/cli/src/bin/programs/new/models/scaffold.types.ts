export interface ScaffoldContext {
  /** Raw project name, e.g. "my-cool-ext" */
  name: string;
  /** PascalCase class name prefix derived from name, e.g. "MyCoolExt" */
  className: string;
  /** Selected target platforms, e.g. ["chrome", "firefox"] */
  platforms: string[];
  /** Whether to scaffold and configure a managed React popup */
  reactPopup: boolean;
  /** Whether to scaffold and configure a managed devtools panel */
  managedDevtools: boolean;
  /** Whether to scaffold the devtools panel with React (requires managedDevtools) */
  reactDevtools: boolean;
  /** Whether to scaffold a minimal blank project (no store, no services, no contract demo) */
  blank: boolean;
}

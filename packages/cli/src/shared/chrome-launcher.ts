// Barrel re-export — all implementation lives in browser-launcher/
export type { AutoLaunchBrowserPlatform, ChromiumExecutableKind, ResolveChromeExecutableOptions, ResolveBrowserExecutableOptions } from './browser-launcher/shared';
export { AUTO_LAUNCH_PLATFORMS, isAutoLaunchSupportedPlatform } from './browser-launcher/shared';

export type { LaunchChromeWithExtensionOptions, LaunchChromeWithExtensionResult, LaunchBrowserWithExtensionOptions, LaunchBrowserWithExtensionResult } from './browser-launcher/chromium-launcher';
export { classifyChromiumExecutable, resolveChromeExecutablePath, resolveBrowserExecutablePath, computeChromiumExtensionId, resolveChromeDebugPort, buildChromeLaunchArgs, launchChromeWithExtension, launchBrowserWithExtension } from './browser-launcher/chromium-launcher';

export type { InstallFirefoxAddonOptions, InstallFirefoxAddonResult } from './browser-launcher/firefox-launcher';
export { resolveFirefoxDebugPort, installFirefoxAddonOverRDP } from './browser-launcher/firefox-launcher';

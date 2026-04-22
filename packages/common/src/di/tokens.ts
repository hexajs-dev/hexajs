// ─── HexaJS System Token Keys ─────────────────────────────────────────────────
// These constants are injected automatically by the CLI at build time.
// Use them with @Inject() in your services, controllers, and handlers.
//
// Example:
//   constructor(@Inject(HEXA_PLATFORM) private platform: string) {}

/** The target browser platform the extension was built for (e.g. 'chrome', 'firefox'). */
export const HEXA_PLATFORM = 'HEXA_PLATFORM';

/** The build mode ('development' | 'production'). */
export const HEXA_BUILD_MODE = 'HEXA_BUILD_MODE';

/** Whether the build was launched in debug mode (true when running via debug.ts). */
export const HEXA_DEBUG = 'HEXA_DEBUG';

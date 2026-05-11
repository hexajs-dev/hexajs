import { ManifestV3 } from './types';

type PlatformTemplateMap = {
    [platform: string]: ManifestV3;
};

/**
 * Chrome, Edge, Brave, Opera — use MV3 service_worker with type:module for background.
 */
const ServiceWorkerTemplate: ManifestV3 = {
    manifest_version: 3,
    name: 'My HexaJS Extension',
    version: '1.0.0',
    description: 'A browser extension built with HexaJS',
    icons: {
        '16': 'assets/icons/icon16.png',
        '32': 'assets/icons/icon32.png',
        '48': 'assets/icons/icon48.png',
        '128': 'assets/icons/icon128.png',
    },
    action: {
        default_icon: {
            '16': 'assets/icons/icon16.png',
            '32': 'assets/icons/icon32.png',
        },
    },
    content_scripts: [],
    permissions: ['storage', 'tabs'],
    host_permissions: ['<all_urls>'],
    background: {
        service_worker: 'background/background.bootstrap.js',
        type: 'module',
    },
};

/**
 * Safari MV3 — uses background.scripts (classic script context).
 * This enables Web Worker APIs for DOM worker tasks that are unavailable
 * in Safari service worker runtimes.
 */
const SafariTemplate: ManifestV3 = {
    manifest_version: 3,
    name: 'My HexaJS Extension',
    version: '1.0.0',
    description: 'A browser extension built with HexaJS',
    icons: {
        '16': 'assets/icons/icon16.png',
        '32': 'assets/icons/icon32.png',
        '48': 'assets/icons/icon48.png',
        '128': 'assets/icons/icon128.png',
    },
    action: {
        default_icon: {
            '16': 'assets/icons/icon16.png',
            '32': 'assets/icons/icon32.png',
        },
    },
    content_scripts: [],
    permissions: ['storage', 'tabs'],
    host_permissions: ['<all_urls>'],
    content_security_policy: {
        // Safari background.scripts + OCR/WebAssembly flows need wasm-unsafe-eval.
        // Projects can still override this in their platform manifest.
        extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
    background: {
        scripts: ['background/background.bootstrap.js'],
    },
};

/**
 * Firefox MV3 does not support service_worker yet.
 * Uses background.scripts array instead.
 */
const FirefoxTemplate: ManifestV3 = {
    manifest_version: 3,
    name: 'My HexaJS Extension',
    version: '1.0.0',
    description: 'A browser extension built with HexaJS',
    icons: {
        '16': 'assets/icons/icon16.png',
        '32': 'assets/icons/icon32.png',
        '48': 'assets/icons/icon48.png',
        '128': 'assets/icons/icon128.png',
    },
    action: {
        default_icon: {
            '16': 'assets/icons/icon16.png',
            '32': 'assets/icons/icon32.png',
        },
    },
    content_scripts: [],
    permissions: ['storage', 'tabs'],
    host_permissions: ['<all_urls>'],
    background: {
        scripts: ['background/background.bootstrap.js'],
        type: 'module',
    },
};

export const platformTemplates: PlatformTemplateMap = {
    chrome: ServiceWorkerTemplate,
    edge: ServiceWorkerTemplate,
    brave: ServiceWorkerTemplate,
    opera: ServiceWorkerTemplate,
    safari: SafariTemplate,
    firefox: FirefoxTemplate,
};

export function getTemplateForPlatform(platform: string): ManifestV3 {
    const template = platformTemplates[platform];
    if (!template) {
        throw new Error(`No manifest template found for platform: "${platform}". Available: ${Object.keys(platformTemplates).join(', ')}`);
    }
    // Return a deep copy to prevent mutation of the template
    return JSON.parse(JSON.stringify(template));
}

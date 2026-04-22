import { ManifestV3 } from './types';

type PlatformTemplateMap = {
    [platform: string]: ManifestV3;
};

/**
 * Chrome, Edge, Brave, Opera, Safari — all use MV3 service_worker for background.
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
    safari: ServiceWorkerTemplate,
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

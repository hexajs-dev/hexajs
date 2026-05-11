export interface ManifestAction {
    default_popup?: string;
    default_icon?: string | Record<string, string>;
    default_title?: string;
}

export interface ManifestIcons {
    [size: string]: string;
}

export interface ManifestContentScript {
    js: string[];
    css?: string[];
    matches: string[];
    exclude_matches?: string[];
    run_at?: 'document_start' | 'document_end' | 'document_idle';
    all_frames?: boolean;
    world?: 'MAIN' | 'ISOLATED';
    /** ES module content scripts (Chrome 120+, Firefox 128+) */
    type?: 'module';
}

export interface ManifestBackgroundChrome {
    service_worker: string;
    type?: 'module';
}

export interface ManifestBackgroundScripts {
    scripts: string[];
    type?: 'module';
}

export type ManifestBackground = ManifestBackgroundChrome | ManifestBackgroundScripts;

export interface ManifestWebAccessibleResource {
    resources: string[];
    matches: string[];
}

export interface ManifestV3 {
    manifest_version: 3;
    name: string;
    version: string;
    description?: string;
    icons?: ManifestIcons;
    action?: ManifestAction;
    devtools_page?: string;
    background: ManifestBackground;
    content_scripts: ManifestContentScript[];
    permissions?: string[];
    host_permissions?: string[];
    web_accessible_resources?: ManifestWebAccessibleResource[];
    content_security_policy?: {
        extension_pages?: string;
        sandbox?: string;
    };
    [key: string]: unknown;
}

export type ManagedUISurface = 'popup' | 'devtools' | 'newtab';

export interface UIUpdateEvent {
    type: 'ui:update';
    surface: ManagedUISurface;
    changedPath: string;
    timestamp: number;
}

export interface UIReloadEvent {
    type: 'ui:reload';
    surface: ManagedUISurface;
    reason: string;
    timestamp: number;
}

export interface BuildErrorEvent {
    type: 'build:error';
    message: string;
    timestamp: number;
}

export interface BackgroundReloadEvent {
    type: 'background:reload';
    reason: string;
    strategy: 'firefox-patch' | 'safari-reload' | 'chromium-cdp' | 'chromium-runtime-reload';
    patchUrl?: string;
    platform?: string;
    timestamp: number;
}

export interface FirefoxBackgroundPatchEvent {
    type: 'FIREFOX_HMR_PATCH';
    patchUrl: string;
    reason: string;
    timestamp: number;
}

export interface ContentPatchInfo {
    filename: string;
    matches: string[];
    allFrames: boolean;
}

export interface ContentReloadEvent {
    type: 'content:reload';
    patches: ContentPatchInfo[];
    timestamp: number;
}

export interface BackgroundOnlineEvent {
    // Sent by background after reconnect/hot-swap; server uses it as reload acknowledgment.
    type: 'background:online';
    timestamp: number;
}

export interface HMRAuthorizeEvent {
    type: 'auth';
    token: string;
    timestamp: number;
}

export type HMRClientEvent = HMRAuthorizeEvent | BackgroundOnlineEvent;

export type HMRServerEvent = UIUpdateEvent | UIReloadEvent | BuildErrorEvent | BackgroundReloadEvent | ContentReloadEvent | FirefoxBackgroundPatchEvent;

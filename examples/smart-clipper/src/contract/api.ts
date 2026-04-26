
export const backgroundClipprtNamespace = 'clipper' as const;

export const BackgroundActionsApi = {
    StartClipping: 'start-clipping',
    ClippingComplete: 'clipping-complete',
    ClippingCancelled: 'clipping-cancelled',
    GetRecentClips: 'get-recent-clips',
    GetDevtoolsState: 'get-devtools-state',
} as const;
export const backgroundApi = {
    StartClipping: `${backgroundClipprtNamespace}:${BackgroundActionsApi.StartClipping}`,
    ClippingComplete: `${backgroundClipprtNamespace}:${BackgroundActionsApi.ClippingComplete}`,
    ClippingCancelled: `${backgroundClipprtNamespace}:${BackgroundActionsApi.ClippingCancelled}`,
    GetRecentClips: `${backgroundClipprtNamespace}:${BackgroundActionsApi.GetRecentClips}`,
    GetDevtoolsState: `${backgroundClipprtNamespace}:${BackgroundActionsApi.GetDevtoolsState}`,
} as const;




export const contentScriptNamespace = 'clipper' as const;
export const ContentScriptHandlesApi = {
    StartClipping: 'start-clipping',
    OcrProgress: 'ocr-progress',
    OcrComplete: 'ocr-complete',
} as const;
export const contentScriptApi = {
    StartClipping: `${contentScriptNamespace}:${ContentScriptHandlesApi.StartClipping}`,
    OcrProgress: `${contentScriptNamespace}:${ContentScriptHandlesApi.OcrProgress}`,
    OcrComplete: `${contentScriptNamespace}:${ContentScriptHandlesApi.OcrComplete}`,
} as const;


export const devtoolsHandlesNamespace = 'clipper' as const;
export const DevtoolsHandlesApi = {
    SyncClips: 'sync-devtools-clips',
    SyncErrors: 'sync-devtools-errors',
    SyncTheme: 'sync-devtools-theme',
} as const;
export const devtoolsHandlesApi = {
    SyncClips: `${devtoolsHandlesNamespace}:${DevtoolsHandlesApi.SyncClips}`,
    SyncErrors: `${devtoolsHandlesNamespace}:${DevtoolsHandlesApi.SyncErrors}`,
    SyncTheme: `${devtoolsHandlesNamespace}:${DevtoolsHandlesApi.SyncTheme}`,
} as const;
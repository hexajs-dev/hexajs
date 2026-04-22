
export const backgroundClipprtNamespace = 'clipper' as const;

export const BackgroundActionsApi = {
    StartClipping: 'start-clipping',
    ClippingComplete: 'clipping-complete',
    ClippingCancelled: 'clipping-cancelled',
    GetRecentClips: 'get-recent-clips',
} as const;
export const backgroundApi = {
    StartClipping: `${backgroundClipprtNamespace}:${BackgroundActionsApi.StartClipping}`,
    ClippingComplete: `${backgroundClipprtNamespace}:${BackgroundActionsApi.ClippingComplete}`,
    ClippingCancelled: `${backgroundClipprtNamespace}:${BackgroundActionsApi.ClippingCancelled}`,
    GetRecentClips: `${backgroundClipprtNamespace}:${BackgroundActionsApi.GetRecentClips}`,
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
declare global {
    namespace webExt {
        namespace extension {
            function isAllowedIncognitoAccess(): Promise<boolean>;
            function isAllowedFileSchemeAccess(): Promise<boolean>;
            function getViews(fetchProperties?: { type?: 'tab' | 'popup' | 'background'; windowId?: number }): Window[];
            function getBackgroundPage(): Window | null;
        }
    }
}

export {};

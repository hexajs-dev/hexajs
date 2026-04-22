declare global {
    interface HexaWebTabsQueryInfo {
        active?: boolean;
        currentWindow?: boolean;
        url?: string | string[];
    }

    interface HexaWebCaptureVisibleTabOptions {
        format?: 'jpeg' | 'png';
        quality?: number;
    }
}

export {};

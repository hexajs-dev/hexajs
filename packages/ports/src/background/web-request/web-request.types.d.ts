declare global {
    type HexaWebWebRequestExtraInfoSpec = 'blocking' | 'requestHeaders' | 'responseHeaders' | 'extraHeaders';

    interface HexaWebWebRequestFilter {
        urls: string[];
        types?: string[];
        tabId?: number;
        windowId?: number;
    }

    interface HexaWebWebRequestDetails {
        requestId: string;
        url: string;
        method: string;
        frameId: number;
        parentFrameId: number;
        tabId: number;
        type: string;
        timeStamp: number;
        initiator?: string;
        statusCode?: number;
        requestHeaders?: Array<{ name: string; value?: string }>;
        responseHeaders?: Array<{ name: string; value?: string }>;
    }

    namespace webExt {
        namespace webRequest {
            const onBeforeRequest: { addListener(callback: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void; removeListener(callback: (details: HexaWebWebRequestDetails) => any): void };
            const onBeforeSendHeaders: { addListener(callback: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void; removeListener(callback: (details: HexaWebWebRequestDetails) => any): void };
            const onHeadersReceived: { addListener(callback: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void; removeListener(callback: (details: HexaWebWebRequestDetails) => any): void };
            const onCompleted: { addListener(callback: (details: HexaWebWebRequestDetails) => void, filter: HexaWebWebRequestFilter): void; removeListener(callback: (details: HexaWebWebRequestDetails) => void): void };
            const onErrorOccurred: { addListener(callback: (details: HexaWebWebRequestDetails) => void, filter: HexaWebWebRequestFilter): void; removeListener(callback: (details: HexaWebWebRequestDetails) => void): void };
        }
    }
}

export {};

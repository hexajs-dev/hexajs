declare global {
    interface HexaWebWebNavigationEventFilter {
        url?: Array<{
            hostContains?: string;
            hostEquals?: string;
            hostPrefix?: string;
            hostSuffix?: string;
            pathContains?: string;
            pathEquals?: string;
            pathPrefix?: string;
            pathSuffix?: string;
            queryContains?: string;
            queryEquals?: string;
            queryPrefix?: string;
            querySuffix?: string;
            urlContains?: string;
            urlEquals?: string;
            urlMatches?: string;
            originAndPathMatches?: string;
            schemes?: string[];
            ports?: number[];
        }>;
    }

    interface HexaWebWebNavigationOnCompletedDetails {
        tabId: number;
        frameId: number;
        parentFrameId: number;
        processId?: number;
        timeStamp: number;
        url: string;
        documentId?: string;
        transitionType?: string;
        transitionQualifiers?: string[];
    }

    namespace webExt {
        namespace webNavigation {
            const onCompleted: {
                addListener(callback: (details: HexaWebWebNavigationOnCompletedDetails) => void, filter?: HexaWebWebNavigationEventFilter): void;
                removeListener(callback: (details: HexaWebWebNavigationOnCompletedDetails) => void): void;
            };
            const onCommitted: {
                addListener(callback: (details: any) => void, filter?: HexaWebWebNavigationEventFilter): void;
                removeListener(callback: (details: any) => void): void;
            };
            const onBeforeNavigate: {
                addListener(callback: (details: any) => void, filter?: HexaWebWebNavigationEventFilter): void;
                removeListener(callback: (details: any) => void): void;
            };
        }
    }
}

export {};

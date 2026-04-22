declare global {
    interface HexaWebRemovalOptions {
        since?: number;
        originTypes?: { unprotectedWeb?: boolean; protectedWeb?: boolean; extension?: boolean };
    }

    interface HexaWebDataTypeSet {
        cache?: boolean;
        cookies?: boolean;
        history?: boolean;
        indexedDB?: boolean;
        localStorage?: boolean;
        passwords?: boolean;
        pluginData?: boolean;
        serviceWorkers?: boolean;
    }

    namespace webExt {
        namespace browsingData {
            function remove(options: HexaWebRemovalOptions, dataToRemove: HexaWebDataTypeSet): Promise<void>;
            function removeCache(options: HexaWebRemovalOptions): Promise<void>;
            function removeCookies(options: HexaWebRemovalOptions): Promise<void>;
            function removeHistory(options: HexaWebRemovalOptions): Promise<void>;
        }
    }
}

export {};

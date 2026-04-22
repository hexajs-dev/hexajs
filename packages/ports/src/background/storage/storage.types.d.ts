declare global {
    type HexaWebStorageAreaName = 'local' | 'sync' | 'session' | 'managed';

    interface HexaWebStorageChange {
        oldValue?: any;
        newValue?: any;
    }

    type HexaWebStorageChangesMap = { [key: string]: HexaWebStorageChange };

    interface HexaWebStorageSetAccessLevelOptions {
        accessLevel: 'TRUSTED_CONTEXTS' | 'TRUSTED_AND_UNTRUSTED_CONTEXTS';
    }

    namespace webExt {
        namespace storage {
            const managed: StorageArea;
            const onChanged: {
                addListener(callback: (changes: HexaWebStorageChangesMap, areaName: HexaWebStorageAreaName) => void): void;
                removeListener(callback: (changes: HexaWebStorageChangesMap, areaName: HexaWebStorageAreaName) => void): void;
            };
            function setAccessLevel(options: HexaWebStorageSetAccessLevelOptions): Promise<void>;
        }
    }
}

export {};

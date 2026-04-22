declare global {
    interface HexaWebManagementIconInfo {
        size: number;
        url: string;
    }

    interface HexaWebManagementExtensionInfo {
        id: string;
        name: string;
        shortName?: string;
        description: string;
        version: string;
        enabled: boolean;
        mayDisable?: boolean;
        type: 'extension' | 'theme' | 'hosted_app' | 'legacy_packaged_app' | 'packaged_app';
        installType?: 'admin' | 'development' | 'normal' | 'sideload' | 'other';
        homepageUrl?: string;
        updateUrl?: string;
        optionsUrl?: string;
        permissions?: string[];
        hostPermissions?: string[];
        icons?: HexaWebManagementIconInfo[];
    }

    namespace webExt {
        namespace management {
            function getAll(callback?: (result: HexaWebManagementExtensionInfo[]) => void): void;
            function getAll(): Promise<HexaWebManagementExtensionInfo[]>;
            function getSelf(callback?: (result: HexaWebManagementExtensionInfo) => void): void;
            function getSelf(): Promise<HexaWebManagementExtensionInfo>;
            function setEnabled(id: string, enabled: boolean, callback?: () => void): void;
            function setEnabled(id: string, enabled: boolean): Promise<void>;
            const onInstalled: { addListener(callback: (info: HexaWebManagementExtensionInfo) => void): void; removeListener(callback: (info: HexaWebManagementExtensionInfo) => void): void };
            const onUninstalled: { addListener(callback: (id: string) => void): void; removeListener(callback: (id: string) => void): void };
            const onEnabled: { addListener(callback: (info: HexaWebManagementExtensionInfo) => void): void; removeListener(callback: (info: HexaWebManagementExtensionInfo) => void): void };
            const onDisabled: { addListener(callback: (info: HexaWebManagementExtensionInfo) => void): void; removeListener(callback: (info: HexaWebManagementExtensionInfo) => void): void };
        }
    }
}

export {};

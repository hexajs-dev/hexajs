declare global {
    interface HexaWebPermissions {
        permissions?: string[];
        origins?: string[];
    }

    namespace webExt {
        namespace permissions {
            function contains(permissions: HexaWebPermissions): Promise<boolean>;
            function getAll(): Promise<HexaWebPermissions>;
            function request(permissions: HexaWebPermissions): Promise<boolean>;
            function remove(permissions: HexaWebPermissions): Promise<boolean>;
            const onAdded: { addListener(callback: (permissions: HexaWebPermissions) => void): void; removeListener(callback: (permissions: HexaWebPermissions) => void): void };
            const onRemoved: { addListener(callback: (permissions: HexaWebPermissions) => void): void; removeListener(callback: (permissions: HexaWebPermissions) => void): void };
        }
    }
}

export {};

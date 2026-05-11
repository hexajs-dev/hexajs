export interface PortPermissionPatch {
    permissions?: string[];
    hostPermissions?: string[];
}

export interface PortPermissionResolver {
    supports(portName: string): boolean;
    resolve(platform: string): PortPermissionPatch;
}

export interface PortPermissionAnalysisResult {
    permissions: string[];
    hostPermissions: string[];
}

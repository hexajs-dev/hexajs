import { createDefaultPortPermissionResolvers } from './port-permission.resolvers';
import { PortPermissionAnalysisResult, PortPermissionPatch, PortPermissionResolver } from './types';

export class PortPermissionAnalyzer {
    constructor(private readonly resolvers: PortPermissionResolver[] = createDefaultPortPermissionResolvers()) {}

    analyze(platform: string, usedPorts: string[]): PortPermissionAnalysisResult {
        const inferredPermissions = new Set<string>();
        const inferredHostPermissions = new Set<string>();

        for (const usedPort of usedPorts) {
            const resolver = this.resolvers.find(currentResolver => currentResolver.supports(usedPort));
            if (!resolver) {
                continue;
            }

            const patch = resolver.resolve(platform);
            this.collectPatch(inferredPermissions, inferredHostPermissions, patch);
        }

        return {
            permissions: [...inferredPermissions].sort((left, right) => left.localeCompare(right)),
            hostPermissions: [...inferredHostPermissions].sort((left, right) => left.localeCompare(right)),
        };
    }

    private collectPatch(
        inferredPermissions: Set<string>,
        inferredHostPermissions: Set<string>,
        patch: PortPermissionPatch,
    ): void {
        for (const permission of patch.permissions || []) {
            inferredPermissions.add(permission);
        }

        for (const hostPermission of patch.hostPermissions || []) {
            inferredHostPermissions.add(hostPermission);
        }
    }
}

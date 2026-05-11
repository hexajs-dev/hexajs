import { HexaContext } from '../compiler/di/types';
import { MetadataRegistry } from '../compiler/registry';
import { HasDependencies, isSupportedPort } from '../generators/shared/ports';

const SUPPORTED_PORT_CONTEXTS: HexaContext[] = [
    HexaContext.Background,
    HexaContext.Content,
    HexaContext.UI,
    HexaContext.General,
];

export class UsedPortsCollector {
    constructor(private readonly registry: MetadataRegistry) {}

    collect(): string[] {
        const packageMetadata = this.registry.getPackageMetadata();
        const usedPorts = new Set<string>();

        for (const source of this.collectDependencySources()) {
            for (const dependency of source.dependencies) {
                if (!isSupportedPort(dependency, packageMetadata, SUPPORTED_PORT_CONTEXTS)) {
                    continue;
                }

                usedPorts.add(dependency);
            }
        }

        return [...usedPorts].sort((left, right) => left.localeCompare(right));
    }

    private collectDependencySources(): HasDependencies[] {
        return [
            ...this.registry.getServices(),
            ...this.registry.getControllers(),
            ...this.registry.getBackgroundEntries(),
            ...this.registry.getHandlers(),
            ...this.registry.getContentEntries(),
            ...this.registry.getViews(),
            ...this.registry.getWorkers(),
        ];
    }
}

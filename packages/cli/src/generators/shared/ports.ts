import { HexaContext } from '../../compiler/di/types';
import { PackageMetadata } from '../../shared/models';

export interface HasDependencies {
  dependencies: string[];
}

export function isSupportedPort(className: string, packageMetadata: PackageMetadata, contexts: HexaContext[]): boolean {
  if (!className.endsWith('Port')) {
    return false;
  }

  const metadata = packageMetadata[className];
  if (!metadata) {
    return true;
  }

  if (!metadata.injectable) {
    return false;
  }

  const allowedContexts = new Set<string>(['empty', ...contexts]);
  return allowedContexts.has(metadata.context);
}

export function resolveRequiredPorts(items: HasDependencies[], packageMetadata: PackageMetadata, contexts: HexaContext[], basePorts: string[] = []): string[] {
  const requiredPorts = new Set<string>(basePorts);

  items.forEach(item => {
    item.dependencies.forEach(dep => {
      if (isSupportedPort(dep, packageMetadata, contexts)) {
        requiredPorts.add(dep);
      }
    });
  });

  return Array.from(requiredPorts).sort((a, b) => a.localeCompare(b));
}

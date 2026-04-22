type TokenDependency = { paramIndex: number; tokenKey: string };
type ViewDependencyRef = { paramIndex: number; viewClassName: string };

export interface DependencyMetadata {
  dependencies: string[];
  tokenDependencies: TokenDependency[];
  viewDependencies?: ViewDependencyRef[];
}

export interface DependencyArgsOptions {
  containerVarName?: string;
}

export function buildDependencyArgs(meta: DependencyMetadata, options: DependencyArgsOptions = {}): string {
  const containerVarName = options.containerVarName || 'container';
  const viewDeps = meta.viewDependencies || [];
  const totalParams = meta.dependencies.length + meta.tokenDependencies.length + viewDeps.length;

  if (totalParams === 0) {
    return '';
  }

  const args: string[] = [];
  let classDepIndex = 0;
  const tokenMap = new Map(meta.tokenDependencies.map(td => [td.paramIndex, td]));
  const viewMap = new Map(viewDeps.map(vd => [vd.paramIndex, vd]));

  for (let i = 0; i < totalParams; i++) {
    const tokenDep = tokenMap.get(i);
    const viewDep = viewMap.get(i);

    if (viewDep) {
      args.push(`${containerVarName}.resolve('__hexa_view_ref__${viewDep.viewClassName}')`);
    } else if (tokenDep) {
      args.push(`${containerVarName}.resolve('${tokenDep.tokenKey}')`);
    } else {
      const dep = meta.dependencies[classDepIndex++];
      args.push(`${containerVarName}.resolve(${dep})`);
    }
  }

  return args.join(', ');
}

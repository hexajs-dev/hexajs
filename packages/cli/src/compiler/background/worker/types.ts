import { TokenDependency } from '../../di/types';

export interface WorkerMetadata {
  className: string;
  name: string;
  environment: string;
  importPath: string;
  dependencies: string[];
  tokenDependencies: TokenDependency[];
  publicMethods: string[];
}

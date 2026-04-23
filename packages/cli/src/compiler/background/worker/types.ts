import { TokenDependency, WorkerPropertyDependency } from '../../di/types';

export interface WorkerMetadata {
  className: string;
  name: string;
  environment: string;
  importPath: string;
  dependencies: string[];
  tokenDependencies: TokenDependency[];
  workerPropertyDependencies: WorkerPropertyDependency[];
  publicMethods: string[];
}

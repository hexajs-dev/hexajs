import { WorkerMetadata } from '../../../compiler/background/worker/types';
import { HexaContext } from '../../../compiler/di/types';
import { DIAnalyzer } from '../../di/analyzer';
import { AnalysisError, AnalysisResult, BaseAnalyzer } from '../../types';

export class WorkerAnalyzer implements BaseAnalyzer {
  private workers: WorkerMetadata[];
  private diAnalyzer: DIAnalyzer;

  constructor(workers: WorkerMetadata[], diAnalyzer: DIAnalyzer) {
    this.workers = workers;
    this.diAnalyzer = diAnalyzer;
  }

  public analyze(): AnalysisResult {
    const errors: AnalysisError[] = [];
    const warnings: AnalysisError[] = [];

    for (const worker of this.workers) {
      for (const dep of worker.dependencies) {
        if (!this.diAnalyzer.isServiceRegistered(dep)) {
          errors.push({
            type: 'missing-service',
            message: `Worker "${worker.className}" (name: "${worker.name}") depends on "${dep}" which is not registered with @Injectable decorator`,
            className: worker.className,
            dependency: dep,
          });
          continue;
        }

        const depContext = this.diAnalyzer.getServiceContext(dep);
        if (depContext === HexaContext.Content || depContext === HexaContext.UI) {
          errors.push({
            type: 'context-violation',
            message: `Worker "${worker.className}" cannot inject ${depContext} service "${dep}". Workers can only inject background and general services`,
            className: worker.className,
            dependency: dep,
            context: depContext,
          });
        }
      }

      for (const workerDep of worker.workerPropertyDependencies) {
        if (!this.diAnalyzer.isWorkerRegistered(workerDep.workerClassName)) {
          errors.push({
            type: 'missing-service',
            message: `Worker "${worker.className}" uses @InjectWorker() on property "${workerDep.propertyName}" but worker "${workerDep.workerClassName}" is not registered with @Worker`,
            className: worker.className,
            dependency: workerDep.workerClassName,
          });
        }
      }

      if (worker.publicMethods.length === 0) {
        warnings.push({
          type: 'invalid-config',
          message: `Worker "${worker.className}" (name: "${worker.name}") has no public methods. It will not be callable via the proxy`,
          className: worker.className,
        });
      }
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
    };
  }
}

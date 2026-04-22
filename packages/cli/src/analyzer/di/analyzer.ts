import { WorkerMetadata } from '../../compiler/background/worker/types';
import { ServiceMetadata, TokenMetadata, HexaContext } from '../../compiler/di/types';
import { PackageMetadata } from '../../shared/models';
import { AnalysisError, AnalysisResult } from '../types';

export class DIAnalyzer {
  private services: Map<string, ServiceMetadata>;
  private workers: Map<string, WorkerMetadata>;
  private packageMetadata: PackageMetadata;
  private tokens: Map<string, TokenMetadata>;

  constructor(services: ServiceMetadata[], packageMetadata: PackageMetadata = {}, tokens: TokenMetadata[] = [], workers: WorkerMetadata[] = []) {
    this.services = new Map(services.map(s => [s.className, s]));
    this.workers = new Map(workers.map(worker => [worker.className, worker]));
    this.packageMetadata = packageMetadata;
    this.tokens = new Map(tokens.map(t => [t.key, t]));
  }

  /**
   * Analyzes DI services for:
   * 1. Circular dependencies
   * 2. Missing dependencies (services not registered with @Injectable)
   * 3. Missing tokens (services inject tokens that don't exist)
   */
  public analyze(): AnalysisResult {
    const errors: AnalysisError[] = [];
    const warnings: AnalysisError[] = [];

    const workerServiceConflicts = this.detectWorkerServiceConflicts();
    errors.push(...workerServiceConflicts);

    // Check for circular dependencies
    const circularErrors = this.detectCircularDependencies();
    errors.push(...circularErrors);

    // Check for missing dependencies
    const missingErrors = this.detectMissingDependencies();
    errors.push(...missingErrors);

    // Check for missing token dependencies
    const tokenErrors = this.detectMissingTokens();
    warnings.push(...tokenErrors);

    // Detect invalid context usage between services across contexts
    const contextErrors = this.detectInvalidContextUsage();
    errors.push(...contextErrors);

    return {
      errors,
      warnings,
      isValid: errors.length === 0
    };
  }

  /**
   * Detects circular dependencies using depth-first search
   */
  private detectCircularDependencies(): AnalysisError[] {
    const errors: AnalysisError[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (className: string, path: string[]): void => {
      if (visiting.has(className)) {
        // Found a cycle
        const cycleStart = path.indexOf(className);
        const cycle = [...path.slice(cycleStart), className].join(' -> ');
        errors.push({
          type: 'circular-dependency',
          message: `Circular dependency detected: ${cycle}`,
          className: className
        });
        return;
      }

      if (visited.has(className)) {
        return;
      }

      const service = this.services.get(className);
      if (!service) {
        return;
      }

      visiting.add(className);

      for (const dep of service.dependencies) {
        visit(dep, [...path, className]);
      }

      visiting.delete(className);
      visited.add(className);
    };

    for (const [className] of this.services) {
      if (!visited.has(className)) {
        visit(className, []);
      }
    }

    return errors;
  }

  private detectWorkerServiceConflicts(): AnalysisError[] {
    const errors: AnalysisError[] = [];

    for (const [className] of this.workers) {
      if (!this.services.has(className)) {
        continue;
      }

      errors.push({
        type: 'invalid-config',
        message: `Class "${className}" cannot be decorated with both @Injectable() and @Worker(). Workers must stay separate from services.`,
        className,
      });
    }

    return errors;
  }

  /**
   * Checks if all dependencies are registered services
   */
  private detectMissingDependencies(): AnalysisError[] {
    const errors: AnalysisError[] = [];

    for (const [className, service] of this.services) {
      for (const dep of service.dependencies) {
        if (!this.isServiceRegistered(dep)) {
          errors.push({
            type: 'missing-service',
            message: `Service "${className}" depends on "${dep}" which is not registered with @Injectable decorator`,
            className: className,
            dependency: dep
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validates cross-context service dependencies.
   * Rules:
   * - Background services cannot inject Content or UI services
   * - Content services cannot inject Background or UI services
   * - UI services cannot inject Background or Content services
   * - General services are allowed to inject any context
   */
  private detectInvalidContextUsage(): AnalysisError[] {
    const errors: AnalysisError[] = [];

    for (const [className, service] of this.services) {
      if (service.context === HexaContext.General) {
        continue;
      }

      for (const dep of service.dependencies) {
        const depContext = this.getServiceContext(dep);
        if (!depContext) {
          continue;
        }

        const violatesBackgroundRule = service.context === HexaContext.Background && (depContext === HexaContext.Content || depContext === HexaContext.UI);
        const violatesContentRule = service.context === HexaContext.Content && (depContext === HexaContext.Background || depContext === HexaContext.UI);
        const violatesUiRule = service.context === HexaContext.UI && (depContext === HexaContext.Background || depContext === HexaContext.Content);

        if (violatesBackgroundRule || violatesContentRule || violatesUiRule) {
          errors.push({
            type: 'context-violation',
            message: `Service "${className}" in "${service.context}" context cannot inject "${dep}" from "${depContext}" context`,
            className,
            dependency: dep,
            context: service.context
          });
        }
      }
    }

    return errors;
  }

  /**
   * Checks if a service exists and is registered (user code or package)
   */
  public isServiceRegistered(className: string): boolean {
    return this.services.has(className) || this.workers.has(className) || !!this.packageMetadata[className];
  }

  /**
   * Gets the context of a service (user code or package)
   */
  public getServiceContext(className: string): string | undefined {
    // Check user services first
    const userService = this.services.get(className);
    if (userService) {
      return userService.context;
    }

    const worker = this.workers.get(className);
    if (worker) {
      return HexaContext.Background;
    }
    
    // Check package metadata
    const packageService = this.packageMetadata[className];
    if (packageService) {
      return packageService.context;
    }
    
    return undefined;
  }

  /**
   * Checks that all @Inject() token dependencies reference tokens that exist
   * (either scanned from code or provided via config).
   * These are warnings, not errors — config tokens may be provided at build time.
   */
  private detectMissingTokens(): AnalysisError[] {
    const warnings: AnalysisError[] = [];

    for (const [className, service] of this.services) {
      for (const tokenDep of service.tokenDependencies) {
        if (!this.tokens.has(tokenDep.tokenKey)) {
          warnings.push({
            type: 'missing-token',
            message: `Service "${className}" injects token "${tokenDep.tokenKey}" which is not defined via createToken() in code or configuration`,
            className,
            tokenKey: tokenDep.tokenKey,
          });
        }
      }
    }

    return warnings;
  }
} 

import { ControllerMetadata } from '../../compiler/background/controller/types';
import { HexaContext } from '../../compiler/di/types';
import { DIAnalyzer } from '../di/analyzer';
import { AnalysisError, AnalysisResult, BaseAnalyzer } from '../types';

export class BackgroundAnalyzer implements BaseAnalyzer {
  private controllers: ControllerMetadata[];
  private diAnalyzer: DIAnalyzer;

  constructor(controllers: ControllerMetadata[], diAnalyzer: DIAnalyzer) {
    this.controllers = controllers;
    this.diAnalyzer = diAnalyzer;
  }

  /**
   * Analyzes background controllers for:
   * 1. Controllers should only inject background and general services
   * 2. All dependencies must be registered services
   * 3. Proper context validation
   */
  public analyze(): AnalysisResult {
    const errors: AnalysisError[] = [];
    const warnings: AnalysisError[] = [];

    for (const controller of this.controllers) {
      // Check if all dependencies are registered
      for (const dep of controller.dependencies) {
        if (!this.diAnalyzer.isServiceRegistered(dep)) {
          errors.push({
            type: 'missing-service',
            message: `Controller "${controller.className}" depends on "${dep}" which is not registered with @Injectable decorator`,
            className: controller.className,
            dependency: dep
          });
          continue;
        }

        // Check if dependency context is valid for background
        const depContext = this.diAnalyzer.getServiceContext(dep);
        if (depContext === HexaContext.Content || depContext === HexaContext.UI) {
          errors.push({
            type: 'context-violation',
            message: `Controller "${controller.className}" cannot inject content or UI service "${dep}". Controllers can only inject background and general services`,
            className: controller.className,
            dependency: dep,
            context: depContext
          });
        }
      }
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0
    };
  }
}

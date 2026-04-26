import { HandlerMetadata } from '../../compiler/content/handler/types';
import { ContentEntryMetadata } from '../../compiler/content/types';
import { ViewMetadata } from '../../compiler/content/view/types';
import { HexaContext } from '../../compiler/di/types';
import { DIAnalyzer } from '../di/analyzer';
import { AnalysisError, AnalysisResult, BaseAnalyzer } from '../types';

export class ContentAnalyzer implements BaseAnalyzer {
  private handlers: HandlerMetadata[];
  private contentEntries: ContentEntryMetadata[];
  private views: ViewMetadata[];
  private viewClassNames: Set<string>;
  private diAnalyzer: DIAnalyzer;

  constructor(handlers: HandlerMetadata[], diAnalyzer: DIAnalyzer, contentEntries: ContentEntryMetadata[] = [], views: ViewMetadata[] = []) {
    this.handlers = handlers;
    this.diAnalyzer = diAnalyzer;
    this.contentEntries = contentEntries;
    this.views = views;
    this.viewClassNames = new Set(views.map(view => view.className));
  }

  /**
   * Analyzes content handlers for:
   * 1. Handlers should only inject content and general services
   * 2. All dependencies must be registered services
   * 3. Proper context validation
   * 4. @InjectView references valid @View classes
   */
  public analyze(): AnalysisResult {
    const errors: AnalysisError[] = [];
    const warnings: AnalysisError[] = [];

    for (const handler of this.handlers) {
      this.validateDependencies(handler, errors);
      this.validateViewDependencies(handler, errors);
      this.validateViewPropertyDependencies(handler, errors);
    }

    for (const entry of this.contentEntries) {
      this.validateViewDependencies(entry, errors);
      this.validateViewPropertyDependencies(entry, errors);
    }

    this.validateViews(errors, warnings);

    return {
      errors,
      warnings,
      isValid: errors.length === 0
    };
  }

  private validateDependencies(handler: HandlerMetadata, errors: AnalysisError[]): void {
    for (const dep of handler.dependencies) {
      if (!this.diAnalyzer.isServiceRegistered(dep)) {
        errors.push({
          type: 'missing-service',
          message: `Handler "${handler.className}" depends on "${dep}" which is not registered with @Injectable decorator`,
          className: handler.className,
          dependency: dep
        });
        continue;
      }

      const depContext = this.diAnalyzer.getServiceContext(dep);
      if (depContext === HexaContext.Background || depContext === HexaContext.UI) {
        errors.push({
          type: 'context-violation',
          message: `Handler "${handler.className}" cannot inject background or UI service "${dep}". Handlers can only inject content and general services`,
          className: handler.className,
          dependency: dep,
          context: depContext
        });
      }
    }
  }

  private validateViewDependencies(meta: { className: string; viewDependencies: { paramIndex: number; viewClassName: string }[] }, errors: AnalysisError[]): void {
    for (const vd of meta.viewDependencies) {
      if (!this.viewClassNames.has(vd.viewClassName)) {
        errors.push({
          type: 'missing-service',
          message: `"${meta.className}" uses @injectView(${vd.viewClassName}) but "${vd.viewClassName}" is not decorated with @View`,
          className: meta.className,
          dependency: vd.viewClassName
        });
      }
    }
  }

  private validateViewPropertyDependencies(meta: { className: string; viewPropertyDependencies?: { propertyName: string; viewClassName: string }[] }, errors: AnalysisError[]): void {
    const deps = meta.viewPropertyDependencies || [];

    for (const vd of deps) {
      if (!this.viewClassNames.has(vd.viewClassName)) {
        errors.push({
          type: 'missing-service',
          message: `"${meta.className}" uses @InjectView() on property "${vd.propertyName}" but "${vd.viewClassName}" is not decorated with @View`,
          className: meta.className,
          dependency: vd.viewClassName
        });
      }
    }
  }

  private validateViews(errors: AnalysisError[], warnings: AnalysisError[]): void {
    for (const view of this.views) {
      for (const dep of view.dependencies) {
        if (!this.diAnalyzer.isServiceRegistered(dep)) {
          errors.push({
            type: 'missing-service',
            message: `View "${view.className}" depends on "${dep}" which is not registered with @Injectable decorator`,
            className: view.className,
            dependency: dep
          });
          continue;
        }

        const depContext = this.diAnalyzer.getServiceContext(dep);
        if (depContext === HexaContext.Background || depContext === HexaContext.UI) {
          errors.push({
            type: 'context-violation',
            message: `View "${view.className}" cannot inject background or UI service "${dep}". Views can only inject content and general services`,
            className: view.className,
            dependency: dep,
            context: depContext
          });
        }
      }
    }
  }

}

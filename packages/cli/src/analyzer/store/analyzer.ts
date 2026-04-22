import { StateMetadata } from "../../compiler/store/types";
import { ServiceMetadata, HexaContext } from "../../compiler/di/types";
import { AnalysisResult, BaseAnalyzer, AnalysisError } from "../types";


export class StoreAnalyzer implements BaseAnalyzer {


  constructor(
    private states: Map<string, StateMetadata>,
    private services: Map<string, ServiceMetadata>
  ) {}

  analyze(): AnalysisResult {
    const errors: AnalysisError[] = [];
    const warnings: AnalysisError[] = [];

    // Check that all injected services of reducers are in the same context as the state
    // Background services cannot be injected into content states and vice versa
    // General services can be injected into any context
    for (const [context, stateMetadata] of this.states) {
      const reducerUsageByClass = new Map<string, string>();

      for (const [feature, reducerMetadata] of Object.entries(stateMetadata.state)) {
        const reducerKey = `${reducerMetadata.className}::${reducerMetadata.importPath}`;
        const firstUsedByFeature = reducerUsageByClass.get(reducerKey);

        if (firstUsedByFeature) {
          errors.push({
            type: 'duplicate-reducer-usage',
            className: reducerMetadata.className,
            context,
            message: `Reducer "${reducerMetadata.className}" is used by multiple state properties in ${context} context: "${firstUsedByFeature}" and "${feature}". Each state property must use a unique reducer class.`
          });
          continue;
        }

        reducerUsageByClass.set(reducerKey, feature);

        for (const dependency of reducerMetadata.dependencies) {
          const service = this.services.get(dependency);
          
          if (!service) {
            // Service not found - this should be caught by DI analyzer
            continue;
          }

          if(context === HexaContext.UI){
            errors.push({
              type: 'invalid-context',
              className: reducerMetadata.className,
              message: `Reducer "${reducerMetadata.className}" cannot be in UI context. UI context is only supported for DI services, not for store configuration.`} );
            continue
          }
          const contextError = this.validateContextCompatibility(
            context,
            service,
            reducerMetadata.className
          );
          
          if (contextError) {
            errors.push(contextError);
          }
        }
      }
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0
    };
  }


  private validateContextCompatibility(stateContext: string, service: ServiceMetadata, reducerClassName: string): AnalysisError | null {
    if (service.context === HexaContext.General) {
      return null;
    }

    if (stateContext === 'content' && service.context === HexaContext.Background) {
      return {
        type: 'context-violation',
        message: `Reducer "${reducerClassName}" in content context cannot inject background service "${service.className}"`,
        className: reducerClassName,
        dependency: service.className,
        context: stateContext
      };
    }

    // Content services cannot be injected into background states
    if (stateContext === 'background' && service.context === HexaContext.Content) {
      return {
        type: 'context-violation',
        message: `Reducer "${reducerClassName}" in background context cannot inject content service "${service.className}"`,
        className: reducerClassName,
        dependency: service.className,
        context: stateContext
      };
    }

    return null;
  }


}
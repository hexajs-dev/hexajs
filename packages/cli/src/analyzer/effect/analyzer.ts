import { ServiceMetadata } from '../../compiler/di/types';
import { StateMetadata } from '../../compiler/store/types';
import { AnalysisResult, BaseAnalyzer, AnalysisError } from '../types';

export class EffectAnalyzer implements BaseAnalyzer {
  constructor(
    private states: StateMetadata[],
    private services: Map<string, ServiceMetadata>
  ) {}

  analyze(): AnalysisResult {
    const errors: AnalysisError[] = [];

    for (const state of this.states) {
      for (const effect of state.effects) {
        if (!this.services.has(effect.className)) {
          errors.push({
            type: 'effect-validation',
            className: effect.className,
            message:
              `Effect class "${effect.className}" registered in @State({ effects: [...] }) ` +
              `for context "${state.context}" is not decorated with @Injectable(). ` +
              `Add @Injectable() to "${effect.className}".`,
          });
        }
      }
    }

    return {
      errors,
      warnings: [],
      isValid: errors.length === 0,
    };
  }
}

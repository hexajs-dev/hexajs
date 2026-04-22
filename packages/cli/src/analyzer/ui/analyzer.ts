import { ResolvedBuildConfig } from '../../bin/config/resolve';
import { ServiceMetadata, HexaContext } from '../../compiler/di/types';
import { StateMetadata } from '../../compiler/store/types';
import { AnalysisError, AnalysisResult, BaseAnalyzer } from '../types';

const HEXA_UI_PACKAGE = '@hexajs/ui';

export class UIAnalyzer implements BaseAnalyzer {
  constructor(private services: ServiceMetadata[], private states: StateMetadata[], private config: ResolvedBuildConfig) {}

  public analyze(): AnalysisResult {
    const errors: AnalysisError[] = [];
    const warnings: AnalysisError[] = [];

    const hasUiServices = this.services.some(service => service.context === HexaContext.UI);

    if (hasUiServices) {
      if (!this.hasAnyUiSurfaceConfigured()) {
        errors.push({
          type: 'invalid-config',
          message: 'UI services were found, but no UI surface is configured. Configure ui.popup or ui.devtools in hexa-cli.config.json.',
          className: 'UI',
          context: HexaContext.UI,
        });
      }

      if (!this.isUiPackageAvailable()) {
        errors.push({
          type: 'missing-package',
          message: `UI services were found but package "${HEXA_UI_PACKAGE}" could not be resolved from the project. Install it or avoid using InjectableContext.UI.`,
          className: 'UI',
          context: HexaContext.UI,
        });
      }
    }

    const invalidUiStore = this.states.find(state => state.context === HexaContext.UI);
    if (invalidUiStore) {
      errors.push({
        type: 'invalid-context',
        message: 'Store configuration for "ui" context is not supported. UI context supports DI only for now.',
        className: 'State',
        context: HexaContext.UI,
      });
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
    };
  }

  private hasAnyUiSurfaceConfigured(): boolean {
    const popupMode = this.config.ui?.popup?.mode;
    const devtoolsMode = this.config.ui?.devtools?.mode;

    const isPopupEnabled = popupMode !== 'none';
    const isDevtoolsEnabled = devtoolsMode !== 'none';

    return isPopupEnabled || isDevtoolsEnabled;
  }

  private isUiPackageAvailable(): boolean {
    try {
      require.resolve(`${HEXA_UI_PACKAGE}/package.json`, { paths: [process.cwd()] });
      return true;
    } catch {
      return false;
    }
  }
}

import { MetadataRegistry } from '../compiler/registry';
import { ResolvedBuildConfig } from '../bin/config/resolve';
import { PackageMetadata } from '../shared/models';
import { BackgroundAnalyzer } from './background/analyzer';
import { WorkerAnalyzer } from './background/worker/analyzer';
import { ContentAnalyzer } from './content/analyzer';
import { DIAnalyzer } from './di/analyzer';
import { StoreAnalyzer } from './store/analyzer';
import { UIAnalyzer } from './ui/analyzer';
import { EffectAnalyzer } from './effect/analyzer';
import { AnalysisError, AnalysisResult } from './types';
import chalk from 'chalk';



export class Analyzer {
  private registry: MetadataRegistry;
  private packageMetadata: PackageMetadata;
  private resolvedConfig: ResolvedBuildConfig;

  constructor(registry: MetadataRegistry, resolvedConfig: ResolvedBuildConfig, packageMetadata: PackageMetadata = {}) {
    this.registry = registry;
    this.packageMetadata = packageMetadata;
    this.resolvedConfig = resolvedConfig;
  }

  /**
   * Performs comprehensive analysis of the entire application:
   * 1. DI validation (circular dependencies, missing services)
   * 2. Background context validation (controllers)
   * 3. Content context validation (handlers)
   * 4. Store context validation (reducer dependencies)
   */
  public analyze(): AnalysisResult {
    const allErrors: AnalysisError[] = [];
    const allWarnings: AnalysisError[] = [];

    const services = this.registry.getServices();
    const controllers = this.registry.getControllers();
    const handlers = this.registry.getHandlers();
    const contentEntries = this.registry.getContentEntries();
    const views = this.registry.getViews();
    const states = this.registry.getStates();
    const workers = this.registry.getWorkers();
    const tokens = this.registry.getTokens();

    const servicesMap = new Map(services.map(service => [service.className, service]));
    const statesMap = new Map(states.map(state => [state.context, state]));

    // Step 1: Analyze DI container
    const diAnalyzer = new DIAnalyzer(services, this.packageMetadata, tokens, workers);
    const diResult = diAnalyzer.analyze();
    allErrors.push(...diResult.errors);
    allWarnings.push(...diResult.warnings);

    // Step 2: Analyze background context
    const backgroundAnalyzer = new BackgroundAnalyzer(
      controllers,
      diAnalyzer
    );
    const backgroundResult = backgroundAnalyzer.analyze();
    allErrors.push(...backgroundResult.errors);
    allWarnings.push(...backgroundResult.warnings);

    // Step 3: Analyze content context
    const contentAnalyzer = new ContentAnalyzer(
      handlers,
      diAnalyzer,
      contentEntries,
      views
    );
    const contentResult = contentAnalyzer.analyze();
    allErrors.push(...contentResult.errors);
    allWarnings.push(...contentResult.warnings);

    // Step 4: Analyze store context
    const storeAnalyzer = new StoreAnalyzer(statesMap, servicesMap);
    const storeResult = storeAnalyzer.analyze();
    allErrors.push(...storeResult.errors);
    allWarnings.push(...storeResult.warnings);

    // Step 5: Analyze UI context rules
    const uiAnalyzer = new UIAnalyzer(services, states, this.resolvedConfig);
    const uiResult = uiAnalyzer.analyze();
    allErrors.push(...uiResult.errors);
    allWarnings.push(...uiResult.warnings);

    // Step 6: Analyze worker context
    const workerAnalyzer = new WorkerAnalyzer(
      workers,
      diAnalyzer
    );
    const workerResult = workerAnalyzer.analyze();
    allErrors.push(...workerResult.errors);
    allWarnings.push(...workerResult.warnings);

    // Step 7: Analyze effect usage
    const effectAnalyzer = new EffectAnalyzer(states, servicesMap);
    const effectResult = effectAnalyzer.analyze();
    allErrors.push(...effectResult.errors);
    allWarnings.push(...effectResult.warnings);

    return {
      errors: allErrors,
      warnings: allWarnings,
      isValid: allErrors.length === 0
    };
  }

  /**
   * Reports analysis results to console
   */
  public report(result: AnalysisResult, verbose = false): void {
    if (result.isValid) {
      if (verbose) {
        const now = new Date();
        const time = now.toTimeString().slice(0, 8);
        console.log(`${chalk.gray(`[${time}]`)} ${chalk.green('✓')} ${chalk.green('Analysis completed successfully. No errors found.')}`);
      }
      return;
    }

    console.error(`\n✗ Analysis failed with ${result.errors.length} error(s):\n`);

    for (const error of result.errors) {
      console.error(`[${error.type}] ${error.message}`);
    }

    if (result.warnings.length > 0) {
      console.warn(`\n⚠ ${result.warnings.length} warning(s):\n`);
      for (const warning of result.warnings) {
        console.warn(`[${warning.type}] ${warning.message}`);
      }
    }

    throw new Error('HexaJS Build Error: Analysis failed. Please fix the errors above.');
  }
}

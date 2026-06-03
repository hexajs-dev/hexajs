import { createHash } from 'crypto';
import { MetadataRegistry } from '../../compiler/registry';
import { HexaContext, ServiceMetadata } from '../../compiler/di/types';
import { ContentEntryMetadata, ContentRunAt } from '../../compiler/content/types';
import { HandlerMetadata } from '../../compiler/content/handler/types';
import { ViewMetadata } from '../../compiler/content/view/types';
import { StoreScriptOutput } from '../store/generator';
import { ConfigToken } from '../../bin/config/config';
import { buildDependencyArgs, extractTokensForContext, generateTokenRegistrations, normalizeImportPath, resolveRequiredPorts, toLowerFirst } from '../shared';
import { ContentHandlerGenerator } from './handler/generator';
import { ContentViewGenerator } from './view/generator';
import { ContentLifecycleGenerator } from './lifecycle/generator';
import { printWarningLine } from '../../shared/logging';

export interface ContentScriptOutput {
  /** The generated bootstrap file content */
  content: string;
  
  /** Unique identifier for this content script file */
  name: string;
  
  /** URL patterns this content script matches */
  matches: string[];
  
  /** When the script should be injected */
  runAt: ContentRunAt;
  
  /** Whether to inject in all frames */
  allFrames: boolean;
  
  /** List of content entry classes included in this bundle */
  contentEntries: string[];
}

interface ContentGenerationSnapshot {
  contentServices: ServiceMetadata[];
  allHandlers: HandlerMetadata[];
  allViews: ViewMetadata[];
  contentStore?: StoreScriptOutput;
  contentTokens: ConfigToken[];
  serviceReferencedViewNames: Set<string>;
  handlersWithoutContents: Set<string>;
  handlerNamesByContentClass: Map<string, Set<string>>;
}

export class ContentGenerator {
  private registry: MetadataRegistry;
  private storeOutputs: StoreScriptOutput[];
  private tokens: ConfigToken[];
  private outputDir: string;
  private watch: boolean;
  private framework: 'react' | 'vue';
  private handlerGenerator: ContentHandlerGenerator;
  private viewGenerator: ContentViewGenerator;
  private lifecycleGenerator: ContentLifecycleGenerator;

  constructor(registry: MetadataRegistry, storeOutputs: StoreScriptOutput[] = [], tokens: ConfigToken[] = [], outputDir: string = '', watch: boolean = false, framework: 'react' | 'vue' = 'react') {
    this.registry = registry;
    this.storeOutputs = storeOutputs;
    this.tokens = tokens;
    this.outputDir = outputDir;
    this.watch = watch;
    this.framework = framework;
    this.handlerGenerator = new ContentHandlerGenerator();
    this.viewGenerator = new ContentViewGenerator(framework);
    this.lifecycleGenerator = new ContentLifecycleGenerator();
  }

  public generate(): ContentScriptOutput[] {
    const contentEntries = this.registry.getContentEntries();
    
    if (contentEntries.length === 0) {
      return [];
    }

    // Group content entries by their injection configuration
    const groups = this.groupContentEntries(contentEntries);
    const snapshot = this.createGenerationSnapshot();

    // Warn if document_start content scripts use async store initialization
    if (snapshot.contentStore?.hasAsyncReducers) {
      const docStartEntries = contentEntries.filter(e => e.options.runAt === ContentRunAt.DocumentStart);
      if (docStartEntries.length > 0) {
        const names = docStartEntries.map(e => e.className).join(', ');
        printWarningLine(`Content script(s) [${names}] use document_start with async store initialization (initAsync). The store will not be available until the async initialization completes.`);
      }
    }

    // Generate a bootstrap file for each group
    return Array.from(groups.entries()).map(([key, entries]) => {
      const { matches, runAt, allFrames } = entries[0].options;
      
      // Use deterministic filenames so manifest/content script references remain stable.
      const hash = createHash('sha256').update(key).digest('hex').slice(0, 8);
      const name = `content-${hash}`;
      
      return {
        name,
        content: this.generateBootstrapFile(entries, name, snapshot),
        matches,
        runAt,
        allFrames: allFrames ?? false,
        contentEntries: entries.map(e => e.className)
      };
    });
  }

  /**
   * Groups content entries by their injection configuration
   * Key: JSON string of sorted {matches, runAt, allFrames}
   */
  private groupContentEntries(entries: ContentEntryMetadata[]): Map<string, ContentEntryMetadata[]> {
    const groups = new Map<string, ContentEntryMetadata[]>();

    entries.forEach(entry => {
      // Create a stable key from the configuration
      // Normalize URL patterns by trimming whitespace for consistency
      const normalizedMatches = entry.options.matches.map(m => m.trim()).sort();
      
      const key = JSON.stringify({
        matches: normalizedMatches,
        runAt: entry.options.runAt,
        allFrames: entry.options.allFrames ?? false
      });

      const existing = groups.get(key) || [];
      groups.set(key, [...existing, entry]);
    });

    return groups;
  }

  /**
   * Generates a complete bootstrap file for a group of content entries
   */
  private generateBootstrapFile(entries: ContentEntryMetadata[], bundleName: string, snapshot: ContentGenerationSnapshot): string {
    const services = snapshot.contentServices;
    const contentStore = snapshot.contentStore;
    const contentTokens = snapshot.contentTokens;

    // Filter handlers that are relevant to these content entries
    const relevantHandlers = this.getRelevantHandlers(entries, snapshot);
    const relevantViews = this.getRelevantViews(entries, relevantHandlers, snapshot);
    const requiredPorts = this.resolveRequiredPorts(services, relevantHandlers, entries);

    const imports = this.generateImports(services, entries, relevantHandlers, requiredPorts, contentStore, relevantViews);
    const containerSetup = this.generateContainerSetup(services, requiredPorts, contentStore, relevantViews);
    const tokenRegistrations = generateTokenRegistrations(contentTokens);
    const serviceLifecycleResolution = this.lifecycleGenerator.generateServiceLifecycleResolution(services, relevantViews);
    const handlerRegistrations = this.handlerGenerator.generateRegistrations(relevantHandlers);
    const contentInits = this.lifecycleGenerator.generateContentInits(entries);
    const lifecycleBootstrap = this.lifecycleGenerator.generateLifecycleBootstrap();

    // Generate effect subscriptions (only if store exists and has registered effects)
    const effectSubscriptions = contentStore ? this.generateEffectSubscriptions() : '';

    return this.generateFile({
      imports,
      containerSetup,
      tokenRegistrations,
      serviceLifecycleResolution,
      handlerRegistrations,
      contentInits,
      lifecycleBootstrap,
      effectSubscriptions,
      bundleName,
      hasStore: !!contentStore,
      hasAsyncStore: !!contentStore?.hasAsyncReducers
    });
  }

  /**
   * Gets services that can be used in content context
   * (Content and General services only)
   */
  private getContentServices(): ServiceMetadata[] {
    return this.registry.getServices().filter(
      s => s.context === HexaContext.Content || s.context === HexaContext.General
    );
  }

  /**
   * Gets handlers that are relevant to the given content entries
   * A handler is relevant if:
   * - It has no contents specified (applies to all content scripts), OR
   * - Any of its specified contents matches one of the content entry classes
   */
  private getRelevantHandlers(entries: ContentEntryMetadata[], snapshot: ContentGenerationSnapshot): HandlerMetadata[] {
    const relevantHandlerNames = new Set(snapshot.handlersWithoutContents);

    for (const entry of entries) {
      const classHandlers = snapshot.handlerNamesByContentClass.get(entry.className);
      if (!classHandlers) {
        continue;
      }
      classHandlers.forEach(handlerName => relevantHandlerNames.add(handlerName));
    }

    return snapshot.allHandlers.filter(handler => relevantHandlerNames.has(handler.className));
  }

  /**
   * Gets views that are used by the given content entries and handlers via @injectView,
   * or views that extend HexaView.
   */
  private getRelevantViews(entries: ContentEntryMetadata[], handlers: HandlerMetadata[], snapshot: ContentGenerationSnapshot): ViewMetadata[] {
    const allViews = snapshot.allViews;
    if (allViews.length === 0) return [];

    const referencedViewNames = new Set(snapshot.serviceReferencedViewNames);

    entries.forEach(entry => {
      this.addViewDependencyNames(referencedViewNames, entry.viewDependencies, entry.viewPropertyDependencies);
    });

    handlers.forEach(handler => {
      this.addViewDependencyNames(referencedViewNames, handler.viewDependencies, handler.viewPropertyDependencies);
    });

    return allViews.filter(v => referencedViewNames.has(v.className) || v.extendsHexaView);
  }

  private createGenerationSnapshot(): ContentGenerationSnapshot {
    const contentServices = this.getContentServices();
    const allHandlers = this.registry.getHandlers();
    const allViews = this.registry.getViews();
    const contentStore = this.storeOutputs.find(s => s.context === HexaContext.Content);
    const contentTokens = extractTokensForContext(this.tokens, 'content');
    const serviceReferencedViewNames = new Set<string>();

    contentServices.forEach(service => {
      this.addViewDependencyNames(serviceReferencedViewNames, service.viewDependencies, service.viewPropertyDependencies);
    });

    const handlersWithoutContents = new Set<string>();
    const handlerNamesByContentClass = new Map<string, Set<string>>();

    allHandlers.forEach(handler => {
      if (handler.contents.length === 0) {
        handlersWithoutContents.add(handler.className);
        return;
      }

      handler.contents.forEach(contentClassName => {
        let handlers = handlerNamesByContentClass.get(contentClassName);
        if (!handlers) {
          handlers = new Set<string>();
          handlerNamesByContentClass.set(contentClassName, handlers);
        }

        handlers.add(handler.className);
      });
    });

    return {
      contentServices,
      allHandlers,
      allViews,
      contentStore,
      contentTokens,
      serviceReferencedViewNames,
      handlersWithoutContents,
      handlerNamesByContentClass,
    };
  }

  private addViewDependencyNames(
    target: Set<string>,
    dependencies: Array<{ viewClassName: string }>,
    propertyDependencies: Array<{ viewClassName: string }>
  ): void {
    dependencies.forEach(dependency => target.add(dependency.viewClassName));
    propertyDependencies.forEach(dependency => target.add(dependency.viewClassName));
  }

  /**
   * Generates all import statements
   */
  private generateImports(services: ServiceMetadata[], contentEntries: ContentEntryMetadata[], handlers: HandlerMetadata[], requiredPorts: string[], contentStore?: StoreScriptOutput, views: ViewMetadata[] = []): string {
    const imports: string[] = [
      `import { Container, setContainer, HEXA_PLATFORM, resolveRouteBoundaryPolicy } from '@hexajs-dev/common';`,
      `import { HandlerContainer, HexaContentClient, HexaPipeRunner } from '@hexajs-dev/core';`,
      `import { createAotOutboundValidationPipe, createAotValidationPipe } from './content.validators';`
    ];

    if (requiredPorts.length > 0) {
      imports.push(`import { ${requiredPorts.join(', ')} } from '@hexajs-dev/ports';`);
    }

    // Import store class if it exists
    if (contentStore) {
      imports.push(`import { HexaContentStore, ActionsSubject, Actions, subscribeEffects } from '@hexajs-dev/core';`);
      if (contentStore.hasAsyncReducers) {
        imports.push(`import { initContentStore } from './${contentStore.context.toLowerCase()}.store';`);
      } else {
        imports.push(`import { ${toLowerFirst(contentStore.context)}Store, actionsSubject } from './${contentStore.context.toLowerCase()}.store';`);
      }
    }

    // Import services
    services.forEach(service => {
      imports.push(`import { ${service.className} } from '${normalizeImportPath(service.importPath, this.outputDir)}';`);
    });

    // Import handlers
    handlers.forEach(handler => {
      imports.push(`import { ${handler.className} } from '${normalizeImportPath(handler.importPath, this.outputDir)}';`);
    });

    // Import content entries
    contentEntries.forEach(entry => {
      imports.push(`import { ${entry.className} } from '${normalizeImportPath(entry.importPath, this.outputDir)}';`);
    });

    imports.push(...this.viewGenerator.generateImports(views, this.outputDir));

    return imports.join('\n');
  }

  /**
   * Generates DI container setup with service registrations
   */
  private generateContainerSetup(services: ServiceMetadata[], requiredPorts: string[], contentStore?: StoreScriptOutput, views: ViewMetadata[] = []): string {
    const registrations: string[] = [
      `  // Register core adapters`,
      ``
    ];

    requiredPorts.forEach(port => {
      registrations.push(`  container.register(${port}, (c) => new ${port}(c.resolve(HEXA_PLATFORM)));`);
    });

    registrations.push(
      `  container.register(HandlerContainer, (c) => new HandlerContainer(c.resolve(RuntimePort)));`,
      `  container.register(HexaContentClient, (c) => new HexaContentClient(c.resolve(RuntimePort)));`,
      ``
    );

    // Register store if it exists
    if (contentStore) {
      const storeRef = contentStore.hasAsyncReducers ? `__storeResult__.${toLowerFirst(contentStore.context)}Store` : `${toLowerFirst(contentStore.context)}Store`;
      const actionsRef = contentStore.hasAsyncReducers ? `__storeResult__.actionsSubject` : `actionsSubject`;
      registrations.push(`  // Register store and actions stream`);
      registrations.push(`  container.register(HexaContentStore, (c) => ${storeRef});`);
      registrations.push(`  container.register(ActionsSubject, () => ${actionsRef});`);
      registrations.push(`  container.register(Actions, () => new Actions(${actionsRef}));`);
      registrations.push(``);
    }

    // Register user services
    services.forEach(service => {
      const deps = buildDependencyArgs(service);
      if (service.viewPropertyDependencies.length > 0) {
        registrations.push(`  container.register(${service.className}, (c) => {`);
        registrations.push(`    const instance = new ${service.className}(${deps});`);
        service.viewPropertyDependencies.forEach(vd => {
          registrations.push(`    instance.${vd.propertyName} = c.resolve(${vd.viewClassName});`);
        });
        registrations.push(`    return instance;`);
        registrations.push(`  });`);
      } else {
        registrations.push(`  container.register(${service.className}, (c) => new ${service.className}(${deps}));`);
      }
    });

    registrations.push(...this.viewGenerator.generateRegistrations(views));

    return registrations.join('\n');
  }

  private resolveRequiredPorts(services: ServiceMetadata[], handlers: HandlerMetadata[], entries: ContentEntryMetadata[]): string[] {
    const packageMetadata = this.registry.getPackageMetadata();
    return resolveRequiredPorts(
      [...services, ...handlers, ...entries],
      packageMetadata,
      [HexaContext.Content, HexaContext.General],
      ['RuntimePort']
    );
  }

  private generateEffectSubscriptions(): string {
    const state = this.registry.getState(HexaContext.Content);
    if (!state || state.effects.length === 0) return '';

    const lines: string[] = [
      `  const store = container.resolve(HexaContentStore);`,
      `  const dispatch = (action) => store.dispatch(action);`,
      `  const subs = [];`,
      ``
    ];

    state.effects.forEach(effect => {
      const instanceName = toLowerFirst(effect.className);
      lines.push(`  const ${instanceName} = container.resolve(${effect.className});`);
      lines.push(`  subs.push(subscribeEffects(${instanceName}, dispatch));`);
      lines.push('');
    });

    lines.push(`  return subs;`);
    return lines.join('\n');
  }

  /**
   * Generates the complete file content
   */
  private generateFile(parts: {
    imports: string;
    containerSetup: string;
    tokenRegistrations: string;
    serviceLifecycleResolution: string;
    handlerRegistrations: string;
    contentInits: string;
    lifecycleBootstrap: string;
    effectSubscriptions: string;
    bundleName: string;
    hasStore: boolean;
    hasAsyncStore: boolean;
  }): string {
    const storeInit = parts.hasAsyncStore ? `const __storeResult__ = await initContentStore();\n` : '';
    const wrapStart = parts.hasAsyncStore ? '(async () => {\n' : '';
    const wrapEnd = parts.hasAsyncStore ? '\n})();' : '';

    if (this.watch) {
      // HMR-aware dual-mode bootstrap
      return `/** 
 * GENERATED BY HEXAJS - DO NOT EDIT 
 * Content Script Bootstrap File (HMR-aware)
 */

${parts.imports}

${wrapStart}${storeInit}
// Check for existing shell (HMR path)
const __HEXA_SHELL_KEY__ = ${JSON.stringify(`__HEXA_SHELL__:${parts.bundleName}`)};
const __existingShell__ = window[__HEXA_SHELL_KEY__];

// Initialize DI Container
const container = new Container();
setContainer(container);

function setupDependencies() {
${parts.containerSetup}
}

function registerTokens() {
${parts.tokenRegistrations}
}

function resolveLifecycleServices() {
${parts.serviceLifecycleResolution}
}

function registerPipes() {
  const pipeRunner = new HexaPipeRunner();
  const handlerContainer = container.resolve(HandlerContainer);
  
  pipeRunner.usePipe(createAotValidationPipe());
  pipeRunner.useOutboundPipe(createAotOutboundValidationPipe());
  handlerContainer.setPipeRunner(pipeRunner);
}

function initializeHandlers() {
${parts.handlerRegistrations}
}

function initializeContent() {
${parts.contentInits}
}

${parts.lifecycleBootstrap}

${parts.effectSubscriptions ? `function subscribeServiceEffects() {
${parts.effectSubscriptions}
}
` : ''}

// HMR handling: tear down previous instance if it exists
if (__existingShell__) {
  console.log('[HexaJS] Content HMR: tearing down previous instance (v' + __existingShell__.version + ')');
  
  // Unsubscribe previous effects
  if (__existingShell__.effectSubs) {
    __existingShell__.effectSubs.forEach(sub => sub.unsubscribe());
  }
  
  // Run onDestroy on all targets from previous shell
  void Promise.all(__existingShell__.onDestroyTargets.map(target => Promise.resolve(target.onDestroy())))
    .catch(error => console.error('[HexaJS] Content HMR: previous onDestroy failed', error));
  
  // Destroy handler container (removes listener, clears maps)
  __existingShell__.handlerContainer.destroy();
}

// Bootstrap sequence
setupDependencies();
registerTokens();
registerPipes();
const serviceLifecycle = resolveLifecycleServices();
const handlerLifecycle = initializeHandlers();
const contentLifecycle = initializeContent();
const onInitTargets = [...serviceLifecycle.onInit, ...handlerLifecycle.onInit, ...contentLifecycle.onInit];
const onDestroyTargets = [...serviceLifecycle.onDestroy, ...handlerLifecycle.onDestroy, ...contentLifecycle.onDestroy];
${parts.effectSubscriptions ? `const effectSubs = subscribeServiceEffects();` : ''}

void runOnInit(onInitTargets).catch(error => {
  console.error('[HexaJS] Content onInit failed', error);
});

registerOnDestroy(onDestroyTargets${parts.effectSubscriptions ? `, effectSubs` : ''});

// Register shell for HMR updates
window[__HEXA_SHELL_KEY__] = {
  container,
  handlerContainer: container.resolve(HandlerContainer),
  onDestroyTargets,
${parts.effectSubscriptions ? `  effectSubs,` : ''}
  version: (__existingShell__?.version ?? 0) + 1,
};

console.log('[HexaJS] Content script ' + (__existingShell__ ? 'hot-replaced (v' + window[__HEXA_SHELL_KEY__].version + ')' : 'initialized'));
${wrapEnd}
`;
    } else {
      // Non-HMR bootstrap (production)
      return `/** 
 * GENERATED BY HEXAJS - DO NOT EDIT 
 * Content Script Bootstrap File
 */

${parts.imports}

${wrapStart}${storeInit}
// Initialize DI Container
const container = new Container();
setContainer(container);

function setupDependencies() {
${parts.containerSetup}
}

function registerTokens() {
${parts.tokenRegistrations}
}

function resolveLifecycleServices() {
${parts.serviceLifecycleResolution}
}

function registerPipes() {
  const pipeRunner = new HexaPipeRunner();
  const handlerContainer = container.resolve(HandlerContainer);
  
  pipeRunner.usePipe(createAotValidationPipe());
  pipeRunner.useOutboundPipe(createAotOutboundValidationPipe());
  handlerContainer.setPipeRunner(pipeRunner);
}

function initializeHandlers() {
${parts.handlerRegistrations}
}

function initializeContent() {
${parts.contentInits}
}

${parts.lifecycleBootstrap}

${parts.effectSubscriptions ? `function subscribeServiceEffects() {
${parts.effectSubscriptions}
}
` : ''}

// Bootstrap sequence
setupDependencies();
registerTokens();
registerPipes();
const serviceLifecycle = resolveLifecycleServices();
const handlerLifecycle = initializeHandlers();
const contentLifecycle = initializeContent();
const onInitTargets = [...serviceLifecycle.onInit, ...handlerLifecycle.onInit, ...contentLifecycle.onInit];
const onDestroyTargets = [...serviceLifecycle.onDestroy, ...handlerLifecycle.onDestroy, ...contentLifecycle.onDestroy];
${parts.effectSubscriptions ? `const effectSubs = subscribeServiceEffects();` : ''}

void runOnInit(onInitTargets).catch(error => {
  console.error('[HexaJS] Content onInit failed', error);
});

registerOnDestroy(onDestroyTargets${parts.effectSubscriptions ? `, effectSubs` : ''});

console.log('[HexaJS] Content script initialized');
${wrapEnd}
`;
    }
  }

}

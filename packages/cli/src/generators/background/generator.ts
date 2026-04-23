import { MetadataRegistry } from '../../compiler/registry';
import { HexaContext, ServiceMetadata } from '../../compiler/di/types';
import { ControllerMetadata } from '../../compiler/background/controller/types';
import { BackgroundEntryMetadata } from '../../compiler/background/types';
import { WorkerMetadata } from '../../compiler/background/worker/types';
import { StoreScriptOutput } from '../store/generator';
import { ConfigToken } from '../../bin/config/config';
import { buildDependencyArgs, extractTokensForContext, generateTokenRegistrations, normalizeImportPath, resolveRequiredPorts, toLowerFirst } from '../shared';
import { BackgroundControllerGenerator } from './controller/generator';

export class BackgroundGenerator {
  private registry: MetadataRegistry;
  private storeOutputs: StoreScriptOutput[];
  private tokens: ConfigToken[];
  private outputDir: string;
  private watch: boolean;
  private hmrAddress: string;
  private hmrSessionToken: string;
  private controllerGenerator: BackgroundControllerGenerator;

  constructor(registry: MetadataRegistry, storeOutputs: StoreScriptOutput[] = [], tokens: ConfigToken[] = [], outputDir: string = '', watch: boolean = false, hmrAddress: string = '', hmrSessionToken: string = '') {
    this.registry = registry;
    this.storeOutputs = storeOutputs;
    this.tokens = tokens;
    this.outputDir = outputDir;
    this.watch = watch;
    this.hmrAddress = hmrAddress;
    this.hmrSessionToken = hmrSessionToken;
    this.controllerGenerator = new BackgroundControllerGenerator();
  }

  /**
   * Generates the background bootstrap code as a string
   * Includes:
   * - DI container setup
   * - Service registrations (background + general context)
   * - Controller registrations
   * - Background entry initialization
   */
  public generate(): string {
    const services = this.getBackgroundServices();
    const controllers = this.registry.getControllers();
    const backgroundEntries = this.registry.getBackgroundEntries();
    const workers = this.registry.getWorkers();
    const requiredPorts = this.resolveRequiredPorts(services, controllers, backgroundEntries);
    const backgroundStore = this.storeOutputs.find(s => s.context === HexaContext.Background);

    // Filter tokens for background context (background + no context specified)
    const backgroundTokens = extractTokensForContext(this.tokens, 'background');

    // Generate imports
    const imports = this.generateImports(services, controllers, backgroundEntries, requiredPorts, backgroundStore, workers);

    // Generate DI container setup
    const containerSetup = this.generateContainerSetup(services, requiredPorts, backgroundStore, workers);

    // Generate token registrations
    const tokenRegistrations = generateTokenRegistrations(backgroundTokens);

    // Generate lifecycle service resolution
    const serviceLifecycleResolution = this.generateServiceLifecycleResolution(services);

    // Generate controller registrations
    const controllerRegistrations = this.controllerGenerator.generateRegistrations(controllers);

    // Generate background entry initializations
    const backgroundInits = this.generateBackgroundInits(backgroundEntries);

    const lifecycleBootstrap = this.generateLifecycleBootstrap();

    // Generate effect subscriptions (only if store exists and has registered effects)
    const effectSubscriptions = backgroundStore ? this.generateEffectSubscriptions() : '';

    // Combine everything
    return this.generateFile({
      imports,
      containerSetup,
      tokenRegistrations,
      serviceLifecycleResolution,
      controllerRegistrations,
      backgroundInits,
      lifecycleBootstrap,
      effectSubscriptions
    });
  }

  /**
   * Gets services that can be used in background context
   * (Background and General services only)
   */
  private getBackgroundServices(): ServiceMetadata[] {
    return this.registry.getServices().filter(
      s => s.context === HexaContext.Background || s.context === HexaContext.General
    );
  }

  /**
   * Generates all import statements
   */
  private generateImports(
    services: ServiceMetadata[],
    controllers: ControllerMetadata[],
    backgroundEntries: BackgroundEntryMetadata[],
    requiredPorts: string[],
    backgroundStore?: StoreScriptOutput,
    workers: WorkerMetadata[] = []
  ): string {
    const imports: string[] = [
      `import { Container, setContainer, HEXA_PLATFORM } from '@hexajs/common';`,
      `import { ControllerContainer, HexaPipeRunner } from '@hexajs/core';`,
      `import { HexaBackgroundClient } from '@hexajs/core';`,
      `import { createAotOutboundValidationPipe, createAotValidationPipe } from './background.validators';`
    ];

    if (requiredPorts.length > 0) {
      imports.push(`import { ${requiredPorts.join(', ')} } from '@hexajs/ports';`);
    }

    // Add worker proxy imports if workers exist
    if (workers.length > 0) {
      imports.push(`import { createWorkerProxy, WorkerEnvironment } from '@hexajs/core';`);
    }

    // Import store class if it exists
    if (backgroundStore) {
      imports.push(`import { HexaBackgroundStore, ActionsSubject, Actions, subscribeEffects } from '@hexajs/core';`);
      imports.push(`import { ${toLowerFirst(backgroundStore.context)}Store, actionsSubject } from './${backgroundStore.context.toLowerCase()}.store';`);
    }

    // Import services
    services.forEach(service => {
      imports.push(`import { ${service.className} } from '${normalizeImportPath(service.importPath, this.outputDir)}';`);
    });

    // Import controllers
    controllers.forEach(controller => {
      imports.push(`import { ${controller.className} } from '${normalizeImportPath(controller.importPath, this.outputDir)}';`);
    });

    // Import background entries
    backgroundEntries.forEach(entry => {
      imports.push(`import { ${entry.className} } from '${normalizeImportPath(entry.importPath, this.outputDir)}';`);
    });

    // Import worker classes (needed for DI token registration)
    workers.forEach(worker => {
      imports.push(`import { ${worker.className} } from '${normalizeImportPath(worker.importPath, this.outputDir)}';`);
    });

    return imports.join('\n');
  }

  /**
   * Generates DI container setup with service registrations
   */
  private generateContainerSetup(services: ServiceMetadata[], requiredPorts: string[], backgroundStore?: StoreScriptOutput, workers: WorkerMetadata[] = []): string {
    const registrations: string[] = [
      `  // Register core adapters`,
      ``
    ];

    requiredPorts.forEach(port => {
      registrations.push(`  container.register(${port}, (c) => new ${port}(c.resolve(HEXA_PLATFORM)));`);
    });

    registrations.push(
      `  container.register(ControllerContainer, (c) => new ControllerContainer(c.resolve(RuntimePort), c.resolve(TabsPort)));`,
      `  container.register(HexaBackgroundClient, (c) => new HexaBackgroundClient(c.resolve(RuntimePort), c.resolve(TabsPort)));`,
      ``
    );

    // Register store if it exists
    if (backgroundStore) {
      const storeVarName = toLowerFirst(backgroundStore.context) + 'Store';
      registrations.push(`  // Register store and actions stream`);
      registrations.push(`  container.register(HexaBackgroundStore, (c) => ${storeVarName});`);
      registrations.push(`  container.register(ActionsSubject, () => actionsSubject);`);
      registrations.push(`  container.register(Actions, () => new Actions(actionsSubject));`);
      registrations.push(``);
    }

    // Register worker proxies BEFORE services (services may depend on workers)
    if (workers.length > 0) {
      registrations.push(`  // Register worker proxies (lazy boot)`);
      workers.forEach(worker => {
        const envValue = worker.environment === 'dom' ? 'WorkerEnvironment.DOM' : 'WorkerEnvironment.Compute';
        registrations.push(`  container.register(${worker.className}, () => createWorkerProxy('${worker.name}', ${envValue}));`);
      });
      registrations.push(``);
    }

    // Register user services
    services.forEach(service => {
      registrations.push(this.generateServiceRegistration(service));
    });

    return registrations.join('\n');
  }

  private generateServiceRegistration(service: ServiceMetadata): string {
    const deps = buildDependencyArgs(service);

    if (service.workerPropertyDependencies.length === 0) {
      return `  container.register(${service.className}, (c) => new ${service.className}(${deps}));`;
    }

    const lines = [
      `  container.register(${service.className}, (c) => {`,
      `    const instance = new ${service.className}(${deps});`,
    ];

    service.workerPropertyDependencies.forEach(workerDep => {
      lines.push(`    instance.${workerDep.propertyName} = c.resolve(${workerDep.workerClassName});`);
    });

    lines.push(`    return instance;`, `  });`);
    return lines.join('\n');
  }

  private resolveRequiredPorts(services: ServiceMetadata[], controllers: ControllerMetadata[], backgroundEntries: BackgroundEntryMetadata[]): string[] {
    const packageMetadata = this.registry.getPackageMetadata();

    const requiredPorts = resolveRequiredPorts(
      [...services, ...controllers, ...backgroundEntries],
      packageMetadata,
      [HexaContext.Background, HexaContext.General],
      ['RuntimePort', 'TabsPort']
    );

    if (this.watch) {
      return Array.from(new Set([...requiredPorts, 'ScriptingPort'])).sort((a, b) => a.localeCompare(b));
    }

    return requiredPorts;
  }

  private generateServiceLifecycleResolution(services: ServiceMetadata[]): string {
    const lifecycleServices = services.filter(service => service.hasOnInit || service.hasOnDestroy);

    if (lifecycleServices.length === 0) {
      return '  return { onInit: [], onDestroy: [] };';
    }

    const lines: string[] = [
      `  const onInit = [];`,
      `  const onDestroy = [];`,
      ``
    ];

    lifecycleServices.forEach(service => {
      const instanceName = toLowerFirst(service.className);
      lines.push(`  const ${instanceName} = container.resolve(${service.className});`);
      if (service.hasOnInit) {
        lines.push(`  onInit.push(${instanceName});`);
      }
      if (service.hasOnDestroy) {
        lines.push(`  onDestroy.push(${instanceName});`);
      }
      lines.push('');
    });

    lines.push(`  return { onInit, onDestroy };`);
    return lines.join('\n');
  }

  /**
   * Generates background entry initializations
   */
  private generateBackgroundInits(entries: BackgroundEntryMetadata[]): string {
    if (entries.length === 0) {
      return '  return { onInit: [], onDestroy: [] };';
    }

    const inits: string[] = [
      `  const onInit = [];`,
      `  const onDestroy = [];`,
      ``
    ];

    entries.forEach(entry => {
      const deps = buildDependencyArgs(entry);
      const instanceName = toLowerFirst(entry.className);

      inits.push(`  const ${instanceName} = new ${entry.className}(${deps});`);

      if (entry.hasOnInit) {
        inits.push(`  onInit.push(${instanceName});`);
      }

      if (entry.hasOnDestroy) {
        inits.push(`  onDestroy.push(${instanceName});`);
      }

      inits.push('');
    });

    inits.push(`  return { onInit, onDestroy };`);

    return inits.join('\n');
  }

  private generateEffectSubscriptions(): string {
    const state = this.registry.getState(HexaContext.Background);
    if (!state || state.effects.length === 0) return '';

    const lines: string[] = [
      `  const store = container.resolve(HexaBackgroundStore);`,
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

  private generateLifecycleBootstrap(): string {
    return `async function runOnInit(targets) {
  if (targets.length === 0) {
    return;
  }

  await Promise.all(targets.map(target => Promise.resolve(target.onInit())));
}

function registerOnDestroy(targets, effectSubs) {
  const runtimePort = container.resolve(RuntimePort);
  runtimePort.onSuspend(() => {
    // Unsubscribe effects first
    if (effectSubs) {
      effectSubs.forEach(sub => sub.unsubscribe());
    }

    if (targets.length === 0) {
      return;
    }

    void Promise.all(targets.map(target => Promise.resolve(target.onDestroy()))).catch(error => {
      console.error('[HexaJS] Background onDestroy failed', error);
    });
  });
}`;
  }

  /**
   * Generates the complete file content
   */
  private generateFile(parts: {
    imports: string;
    containerSetup: string;
    tokenRegistrations: string;
    serviceLifecycleResolution: string;
    controllerRegistrations: string;
    backgroundInits: string;
    lifecycleBootstrap: string;
    effectSubscriptions: string;
  }): string {
    const hmrCode = this.watch && this.hmrAddress ? this.generateHmrClient() : '';

    return `/** 
 * GENERATED BY HEXAJS - DO NOT EDIT 
 * Background Bootstrap File
 */

${parts.imports}

// Initialize DI Container
export let container = new Container();

function assignContainer(nextContainer) {
  container = nextContainer;
  setContainer(container);
}

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
  const controllerContainer = container.resolve(ControllerContainer);
  
  pipeRunner.usePipe(createAotValidationPipe());
  pipeRunner.useOutboundPipe(createAotOutboundValidationPipe());
  controllerContainer.setPipeRunner(pipeRunner);
}

function initializeControllers() {
${parts.controllerRegistrations}
}

function initializeBackground() {
${parts.backgroundInits}
}

${parts.lifecycleBootstrap}

${parts.effectSubscriptions ? `function subscribeServiceEffects() {
${parts.effectSubscriptions}
}
` : ''}

${hmrCode}

function createBackgroundRegistry(version) {
  const serviceLifecycle = resolveLifecycleServices();
  const controllerLifecycle = initializeControllers();
  const backgroundLifecycle = initializeBackground();
  const onInitTargets = [...serviceLifecycle.onInit, ...controllerLifecycle.onInit, ...backgroundLifecycle.onInit];
  const onDestroyTargets = [...serviceLifecycle.onDestroy, ...controllerLifecycle.onDestroy, ...backgroundLifecycle.onDestroy];
${parts.effectSubscriptions ? `  const effectSubs = subscribeServiceEffects();` : ''}

  void runOnInit(onInitTargets).catch(error => {
    console.error('[HexaJS] Background onInit failed', error);
  });

  registerOnDestroy(onDestroyTargets${parts.effectSubscriptions ? `, effectSubs` : ''});

  return {
    container,
    controllerContainer: container.resolve(ControllerContainer),
    onDestroyTargets,
${parts.effectSubscriptions ? `    effectSubs,` : ''}
    version,
  };
}

${this.watch ? `function toGlobalRegistry(registry) {
  const registryContainer = registry.container;
  registryContainer.__hexa_bg_controllerContainer = registry.controllerContainer;
  registryContainer.__hexa_bg_onDestroyTargets = registry.onDestroyTargets;
  registryContainer.__hexa_bg_effectSubs = registry.effectSubs || [];
  registryContainer.version = registry.version;
  registryContainer.hotSwapService = hotSwapService;
  return registryContainer;
}
` : ''}

function bootstrapBackground(version) {
  assignContainer(new Container());
  setupDependencies();
  registerTokens();
  registerPipes();
  return createBackgroundRegistry(version);
}

${this.watch ? `async function teardownBackgroundRegistry(registry) {
  if (!registry) {
    return;
  }

  // Unsubscribe effects
  const effectSubs = Array.isArray(registry.__hexa_bg_effectSubs) ? registry.__hexa_bg_effectSubs : [];
  effectSubs.forEach(sub => sub.unsubscribe());

  const onDestroyTargets = Array.isArray(registry.__hexa_bg_onDestroyTargets) ? registry.__hexa_bg_onDestroyTargets : [];
  if (onDestroyTargets.length > 0) {
    await Promise.all(onDestroyTargets.map(target => Promise.resolve(target.onDestroy())));
  }

  if (registry.__hexa_bg_controllerContainer?.destroy) {
    registry.__hexa_bg_controllerContainer.destroy();
  }
}

async function hotSwapBackground(reason) {
  const previous = (globalThis).__HEXA_BG_REGISTRY__;
  const nextVersion = ((previous?.version ?? 0) + 1);

  if (previous) {
    await teardownBackgroundRegistry(previous);
  }

  const next = bootstrapBackground(nextVersion);
  const nextRegistry = toGlobalRegistry(next);
  (globalThis).__HEXA_BG_REGISTRY__ = nextRegistry;
  console.log('[HexaJS] Background hot-swap applied (v' + nextVersion + '): ' + reason);
  return nextRegistry;
}

async function hotSwapService(reason = 'background patch') {
  return hotSwapBackground(reason);
}
` : ''}

${this.watch ? `const __existingBgRegistry__ = (globalThis).__HEXA_BG_REGISTRY__;

if (__existingBgRegistry__) {
  void hotSwapService('background bootstrap reloaded').then(() => {
    const hmrWs = (globalThis).__HEXA_BG_HMR_CLIENT__;
    if (hmrWs && hmrWs.readyState === WebSocket.OPEN) {
      hmrWs.send(JSON.stringify({ type: 'background:online', timestamp: Date.now() }));
    }
  }).catch(error => {
    console.error('[HexaJS] Background hot-swap failed', error);
  });
} else {
  const initialRegistry = bootstrapBackground(1);
  (globalThis).__HEXA_BG_REGISTRY__ = toGlobalRegistry(initialRegistry);
  console.log('[HexaJS] Background context initialized');
}

// Initialize HMR WebSocket client
void setupHmrClient().catch(error => {
  console.error('[HexaJS] Background HMR client setup failed', error);
});

` : `bootstrapBackground(1);
console.log('[HexaJS] Background context initialized');
`}
`;
  }

  private generateHmrClient(): string {
    return `async function setupHmrClient() {
  if ((globalThis).__HEXA_BG_HMR_CLIENT__) {
    return;
  }

  const scriptingPort = container.resolve(ScriptingPort);
  const tabsPort = container.resolve(TabsPort);
  const runtimePort = container.resolve(RuntimePort);

  const ws = new WebSocket('${this.hmrAddress}');
  (globalThis).__HEXA_BG_HMR_CLIENT__ = ws;

  ws.addEventListener('open', () => {
    console.log('[HexaJS HMR] Background client connected');
    ws.send(JSON.stringify({ type: 'auth', token: '${this.hmrSessionToken}', timestamp: Date.now() }));
    ws.send(JSON.stringify({ type: 'background:online', timestamp: Date.now() }));
  });

  ws.addEventListener('message', async (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === 'content:reload' && message.patches) {
        console.log('[HexaJS HMR] Received content:reload event with ' + message.patches.length + ' patches');

        for (const patch of message.patches) {
          try {
            // Query all tabs matching the patch's URL patterns
            const queryPatterns = patch.matches;
            const tabs = await tabsPort.queryTabs({});
            const shouldMatchAllTabs = queryPatterns.includes('<all_urls>');

            // Filter tabs that match any of the URL patterns
            const matchingTabs = tabs.filter(tab => {
              if (shouldMatchAllTabs) {
                return typeof tab.id === 'number';
              }
              if (!tab.url) return false;
              return queryPatterns.some(pattern => {
                // Simple glob-to-regex conversion
                const regexPattern = pattern
                  .replace(/\\./g, '\\\\.')
                  .replace(/\\*/g, '.*')
                  .replace(/\\?/g, '.');
                const regex = new RegExp('^' + regexPattern + '$');
                return regex.test(tab.url);
              });
            });

            console.log('[HexaJS HMR] Matched ' + matchingTabs.length + ' tabs for patch: ' + patch.filename);

            // Execute the patch script on all matching tabs
            for (const tab of matchingTabs) {
              try {
                await scriptingPort.executeScript({
                  target: {
                    tabId: tab.id,
                    allFrames: patch.allFrames ?? false,
                  },
                  files: [patch.filename],
                });
              } catch (tabError) {
                console.warn('[HexaJS HMR] Failed to execute patch on tab ' + tab.id, tabError);
              }
            }

            console.log('[HexaJS HMR] Content patch applied: ' + patch.filename + ' (' + matchingTabs.length + ' tabs)');
          } catch (patchError) {
            console.error('[HexaJS HMR] Patch processing failed', patchError);
          }
        }
        return;
      }

      if (message.type === 'FIREFOX_HMR_PATCH' && message.patchUrl) {
        const script = document.createElement('script');
        script.src = message.patchUrl;
        script.type = 'module';
        script.onload = () => {
          console.log('[HexaJS HMR] Firefox background patch applied successfully');
          script.remove();
        };
        document.head.appendChild(script);
        return;
      }

      if (message.type === 'background:reload' && message.strategy === 'safari-reload') {
        console.log('[HexaJS HMR] Safari background reload requested');
        runtimePort.reload();
        return;
      }

      if (message.type === 'background:reload' && message.strategy === 'chromium-runtime-reload') {
        console.log('[HexaJS HMR] Chromium debug port unavailable; runtime reload requested');
        runtimePort.reload();
      }
    } catch (parseError) {
      console.error('[HexaJS HMR] Message parsing failed', parseError);
    }
  });

  ws.addEventListener('error', (error) => {
    console.error('[HexaJS HMR] WebSocket error', error);
  });

  ws.addEventListener('close', () => {
    console.log('[HexaJS HMR] Background client disconnected');
    if ((globalThis).__HEXA_BG_HMR_CLIENT__ === ws) {
      (globalThis).__HEXA_BG_HMR_CLIENT__ = undefined;
    }
  });
}`;
  }

}

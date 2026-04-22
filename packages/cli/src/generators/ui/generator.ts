import { MetadataRegistry } from '../../compiler/registry';
import { HexaContext, ServiceMetadata } from '../../compiler/di/types';
import { StoreScriptOutput } from '../store/generator';
import { ConfigToken } from '../../bin/config/config';
import { buildDependencyArgs, extractTokensForContext, generateTokenRegistrations, normalizeImportPath, resolveRequiredPorts, toLowerFirst } from '../shared';

export interface UIBootstrapOutput {
  /** The generated bootstrap file content */
  content: string;
  /** Output file name (without extension) */
  name: string;
}

export class UIGenerator {
  private registry: MetadataRegistry;
  private storeOutputs: StoreScriptOutput[];
  private tokens: ConfigToken[];
  private outputDir: string;

  constructor(registry: MetadataRegistry, storeOutputs: StoreScriptOutput[] = [], tokens: ConfigToken[] = [], outputDir: string = '') {
    this.registry = registry;
    this.storeOutputs = storeOutputs;
    this.tokens = tokens;
    this.outputDir = outputDir;
  }

  /**
   * Generates the UI bootstrap file as a string.
   * Includes:
   * - DI container setup
   * - Service registrations (UI + General context)
   * - Token registrations
   *
   * The bootstrap calls `setContainer()` so `inject()` from
   * `@hexajs/core` works in any UI code after the bootstrap runs.
   */
  public generate(): UIBootstrapOutput {
    const services = this.getUIServices();

    // If no UI services exist, return a minimal vendor with just tokens
    const uiStore = this.storeOutputs.find(s => s.context === HexaContext.UI);

    // Filter tokens for UI context (ui + no context specified)
    const uiTokens = extractTokensForContext(this.tokens, 'ui');

    const requiredPorts = this.resolveRequiredPorts(services);

    const imports = this.generateImports(services, requiredPorts, uiStore);
    const containerSetup = this.generateContainerSetup(services, requiredPorts, uiStore);
    const tokenRegistrations = generateTokenRegistrations(uiTokens);

    const content = this.generateFile({ imports, containerSetup, tokenRegistrations });

    return { content, name: 'ui.bootstrap' };
  }

  /**
   * Gets services that can be used in UI context
   * (UI and General services only)
   */
  private getUIServices(): ServiceMetadata[] {
    return this.registry.getServices().filter(
      s => s.context === HexaContext.UI || s.context === HexaContext.General
    );
  }

  /**
   * Generates all import statements
   */
  private generateImports(services: ServiceMetadata[], requiredPorts: string[], uiStore?: StoreScriptOutput): string {
    const imports: string[] = [
      `import { Container, setContainer, HEXA_PLATFORM } from '@hexajs/common';`,
      `import { HexaUIClient } from '@hexajs/ui';`
    ];

    if (requiredPorts.length > 0) {
      imports.push(`import { ${requiredPorts.join(', ')} } from '@hexajs/ports';`);
    }

    // Import store if it exists
    if (uiStore) {
      imports.push(`import { ${toLowerFirst(uiStore.context)}Store } from './${uiStore.context.toLowerCase()}.store';`);
    }

    // Import services
    services.forEach(service => {
      imports.push(`import { ${service.className} } from '${normalizeImportPath(service.importPath, this.outputDir)}';`);
    });

    return imports.join('\n');
  }

  /**
   * Generates DI container setup with service registrations
   */
  private generateContainerSetup(services: ServiceMetadata[], requiredPorts: string[], uiStore?: StoreScriptOutput): string {
    const registrations: string[] = [
      `  // Register core adapters`,
      ``
    ];

    requiredPorts.forEach(port => {
      registrations.push(`  container.register(${port}, (c) => new ${port}(c.resolve(HEXA_PLATFORM)));`);
    });

    registrations.push(
      `  container.register(HexaUIClient, (c) => new HexaUIClient(c.resolve(RuntimePort)));`,
      ``
    );

    // Register store if it exists
    if (uiStore) {
      const storeVarName = toLowerFirst(uiStore.context) + 'Store';
      registrations.push(`  // Register store`);
      registrations.push(`  container.register('${uiStore.context}Store', (c) => ${storeVarName});`);
      registrations.push(``);
    }

    // Register user services
    if (services.length > 0) {
      registrations.push(`  // Register services`);
      services.forEach(service => {
        const deps = buildDependencyArgs(service);
        registrations.push(`  container.register(${service.className}, (c) => new ${service.className}(${deps}));`);
      });
    }

    if (registrations.length === 0) {
      return '  // No services to register';
    }

    return registrations.join('\n');
  }

  private resolveRequiredPorts(services: ServiceMetadata[]): string[] {
    const packageMetadata = this.registry.getPackageMetadata();
    return resolveRequiredPorts(
      services,
      packageMetadata,
      [HexaContext.UI, HexaContext.General],
      ['RuntimePort']
    );
  }

  /**
   * Generates the complete bootstrap file content
   */
  private generateFile(parts: { imports: string; containerSetup: string; tokenRegistrations: string }): string {
    return `/** 
 * GENERATED BY HEXAJS - DO NOT EDIT 
 * UI Bootstrap File — DI Container for UI Context
 */

${parts.imports}

// Initialize DI Container
const container = new Container();
setContainer(container);

function setupDependencies() {
${parts.containerSetup}
}

function registerTokens() {
${parts.tokenRegistrations}
}

// Bootstrap
setupDependencies();
registerTokens();

console.log('[HexaJS] UI context initialized');
`;
  }

}

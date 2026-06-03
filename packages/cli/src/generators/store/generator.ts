import * as path from 'path';
import { MetadataRegistry } from '../../compiler/registry';
import { StateMetadata } from '../../compiler/store/types';
import { ReducerMetadata } from '../../compiler/store/reducer/types';
import { toLowerFirst } from '../shared';

export interface StoreScriptOutput {
  /** The generated store file content */
  content: string;
  
  /** Context identifier (e.g., 'Background', 'Content') */
  context: string;
  
  /** List of reducer features included in this store */
  features: string[];

  /** Whether any reducer in this store uses async initState */
  hasAsyncReducers: boolean;
}

export class StoreGenerator {
  private registry: MetadataRegistry;
  private outputDir: string;

  constructor(registry: MetadataRegistry, outputDir: string = '') {
    this.registry = registry;
    this.outputDir = outputDir;
  }

  public generate(): StoreScriptOutput[] {
    const states = this.registry.getStates();
    
    if (states.length === 0) {
      return [];
    }

    // Generate a store file for each context (Background, Content, etc.)
    return states.map(state => this.generateStoreFile(state));
  }

  /**
   * Generates a complete store file for a specific context
   */
  private generateStoreFile(state: StateMetadata): StoreScriptOutput {
    const features = Object.keys(state.state);
    const hasAsyncReducers = Object.values(state.state).some(r => r.hasInitState && r.isAsyncInitState);
    const imports = this.generateImports(state);
    const reducerCreations = this.generateReducerCreations(state);
    const storeCreation = this.generateStoreCreation(state);

    const content = this.generateFile({
      imports,
      reducerCreations,
      storeCreation
    }, state.context, hasAsyncReducers);

    return {
      content,
      context: state.context,
      features,
      hasAsyncReducers
    };
  }

  /**
   * Generates all import statements
   */
  private generateImports(state: StateMetadata): string {
    const storeClass = this.getStoreClassName(state.context);
    const imports: string[] = [
      `import { createReducer, ${storeClass}, on, ActionsSubject } from '@hexajs-dev/core';`
    ];

    // Import each reducer class
    Object.values(state.state).forEach(reducer => {
      imports.push(`import { ${reducer.className} } from '${this.normalizeImportPath(reducer.importPath, state.context)}';`);
    });

    return imports.join('\n');
  }

  /**
   * Generates reducer creation code using createReducer and on functions
   */
  private generateReducerCreations(state: StateMetadata): string {
    const creations: string[] = [];

    Object.entries(state.state).forEach(([featureName, reducer]) => {
      creations.push(this.generateSingleReducer(featureName, reducer));
      creations.push(''); // Empty line between reducers
    });

    return creations.join('\n');
  }

  /**
   * Generates a single reducer using createReducer
   */
  private generateSingleReducer(featureName: string, reducer: ReducerMetadata): string {
    const instanceName = `${toLowerFirst(reducer.className)}Instance`;
    const initialStateName = `${featureName}InitialState`;
    const reducerVarName = `${featureName}Reducer`;

    const initLine = reducer.hasInitState
      ? (reducer.isAsyncInitState
        ? `const ${initialStateName} = await ${instanceName}.initState();`
        : `const ${initialStateName} = ${instanceName}.initState();`)
      : `const ${initialStateName} = ${instanceName}.initialState;`;

    const lines: string[] = [
      `// ${featureName} Reducer`,
      `const ${instanceName} = new ${reducer.className}();`,
      initLine
    ];

    // Generate on() handlers for each @Reduce method
    const onHandlers = reducer.methods.map(method => {
      return `  on('${method.reduce}', (state, action) => ${instanceName}.${method.methodName}(state, action))`;
    });

    lines.push(
      `const ${reducerVarName} = createReducer(`,
      `  ${initialStateName},`,
      onHandlers.join(',\n'),
      `);`
    );

    return lines.join('\n');
  }

  /**
   * Generates the store creation using createStore
   */
  private generateStoreCreation(state: StateMetadata): string {
    const features = Object.keys(state.state);
    const storeVarName = `${toLowerFirst(state.context)}Store`;
    const storeClass = this.getStoreClassName(state.context);

    const lines: string[] = [
      `// Create Actions Subject`,
      `export const actionsSubject = new ActionsSubject();`,
      ``,
      `// Create Store`,
      `export const ${storeVarName} = new ${storeClass}({`
    ];

    // Add each feature reducer
    features.forEach((featureName, index) => {
      const comma = index < features.length - 1 ? ',' : '';
      lines.push(`  ${featureName}: ${featureName}Reducer${comma}`);
    });

    lines.push(`}, actionsSubject);`);

    return lines.join('\n');
  }

  /**
   * Generates the complete file content
   */
  private generateFile(parts: {
    imports: string;
    reducerCreations: string;
    storeCreation: string;
  }, context?: string, hasAsyncReducers?: boolean): string {
    const header = `/** 
 * GENERATED BY HEXAJS - DO NOT EDIT 
 * Store Bootstrap File
 */`;

    // Content scripts use IIFE format which doesn't support top-level await.
    // Wrap initialization in an exported async function only when async reducers exist.
    if (context === 'content' && hasAsyncReducers) {
      const innerReducers = parts.reducerCreations.split('\n').map(l => l ? '  ' + l : l).join('\n');
      // Strip 'export ' from store creation since it's inside a function body
      const innerStore = parts.storeCreation.replace(/export /g, '').split('\n').map(l => l ? '  ' + l : l).join('\n');
      const exportNames = this.extractVarNames(parts.storeCreation);

      return `${header}

${parts.imports}

export async function initContentStore() {
${innerReducers}
${innerStore}

  return { ${exportNames.join(', ')} };
}
`;
    }

    return `${header}

${parts.imports}

${parts.reducerCreations}
${parts.storeCreation}
`;
  }

  /**
   * Extracts variable names from 'export const X' declarations
   */
  private extractVarNames(code: string): string[] {
    const names: string[] = [];
    const regex = /export const (\w+)/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      names.push(match[1]);
    }
    return names;
  }

  /**
   * Normalizes import paths:
   * - Strips .ts extension
   * - Converts absolute paths to relative paths from the output directory
   */
  private normalizeImportPath(absPath: string, context?: string): string {
    const stripped = absPath.replace(/\.ts$/, '');
    if (!this.outputDir || !path.isAbsolute(stripped)) {
      return stripped;
    }
    const baseDir = context ? path.join(this.outputDir, context.toLowerCase()) : this.outputDir;
    let rel = path.relative(baseDir, stripped).replace(/\\/g, '/');
    if (!rel.startsWith('.')) {
      rel = './' + rel;
    }
    return rel;
  }

  private getStoreClassName(context: string): string {
    const contextMap: Record<string, string> = {
      'background': 'HexaBackgroundStore',
      'content': 'HexaContentStore'
    };
    const cls = contextMap[context];
    if (!cls) {
      throw new Error(`Unsupported store context: "${context}". Only background and content contexts support stores.`);
    }
    return cls;
  }
}
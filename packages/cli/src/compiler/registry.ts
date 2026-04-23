import { BackgroundEntryMetadata } from "./background/types";
import { WorkerMetadata } from "./background/worker/types";
import { ContentEntryMetadata } from "./content/types";
import { ControllerMetadata } from "./background/controller/types";
import { ServiceMetadata, TokenMetadata } from "./di/types";
import { HandlerMetadata } from "./content/handler/types";
import { StateMetadata } from "./store/types";
import { DtoValidationMetadata } from './dto/types';
import { ViewMetadata } from './content/view/types';
import { PackageMetadata } from '../shared/models';
import { HEXA_BUILD_MODE, HEXA_DEBUG, HEXA_PLATFORM } from '@hexajs/common';

const RESERVED_FRAMEWORK_TOKEN_KEYS = new Set([HEXA_PLATFORM, HEXA_BUILD_MODE, HEXA_DEBUG]);

export class MetadataRegistry {
  private services = new Map<string, ServiceMetadata>();
  private backgroundEntries = new Map<string, BackgroundEntryMetadata>();
  private contentEntries = new Map<string, ContentEntryMetadata>();

  private controllers: ControllerMetadata[] = [];
  private actionNames = new Set<string>();

  private handlers: HandlerMetadata[] = [];
  private handleNames = new Set<string>();

  private workers = new Map<string, WorkerMetadata>(); // name -> WorkerMetadata
  private states = new Map<string, StateMetadata>(); // context -> StateMetadata
  private tokens = new Map<string, TokenMetadata>(); // key -> TokenMetadata
  private dtoValidations = new Map<string, DtoValidationMetadata>(); // dto class -> metadata
  private views = new Map<string, ViewMetadata>(); // className -> ViewMetadata
  private viewIds = new Set<string>(); // track unique view ids
  private packageMetadata: PackageMetadata = {};

  // --- Adders ---
  public addService(meta: ServiceMetadata) {
    if (this.services.has(meta.className)) {
      throw new Error(
        `HexaJS Build Error: Duplicate @Injectable class "${meta.className}" found. ` +
        `Each injectable class must have a unique name across the entire application.`
      );
    }
    this.services.set(meta.className, meta);
  }

  public addBackgroundEntry(meta: BackgroundEntryMetadata) {
    if (this.backgroundEntries.has(meta.className)) {
      throw new Error(
        `HexaJS Build Error: Duplicate @Background class "${meta.className}" found. ` +
        `Background entry class names must be unique across the entire application.`
      );
    }
    this.backgroundEntries.set(meta.className, meta);
  }

  public addContentEntry(meta: ContentEntryMetadata) {
    const key = `${meta.importPath}::${meta.className}`;
    if (this.contentEntries.has(key)) {
      throw new Error(
        `HexaJS Build Error: Duplicate @Content class "${meta.className}" found in "${meta.importPath}". ` +
        `Each @Content class must have a unique name.`
      );
    }
    this.contentEntries.set(key, meta);
  }

  // --- Accessors ---
  public getService(name: string) { return this.services.get(name); }

  public getBackgroundEntries() {
    return Array.from(this.backgroundEntries.values());
  }


  /**
   * Groups Content Scripts by their unique match patterns
   */
  public getContentGroups(): Map<string, ContentEntryMetadata[]> {
    const groups = new Map<string, ContentEntryMetadata[]>();

    this.contentEntries.forEach(entry => {
      // Sort and stringify the matches to create a stable key
      const groupKey = JSON.stringify([...entry.options.matches].sort());

      const existing = groups.get(groupKey) || [];
      groups.set(groupKey, [...existing, entry]);
    });

    return groups;
  }



  // controllers
  public addController(meta: ControllerMetadata) {
    meta.methods.forEach(m => {
      if (m.actionName) {
        // We use the full string 'namespace:action' for the check
        const fullPath = `${meta.namespace}:${m.actionName}`;

        if (this.actionNames.has(fullPath)) {
          throw new Error(
            `HexaJS Build Error: Duplicate Action path "${fullPath}" found. ` +
            `Check class ${meta.className}. Actions must be unique across the entire context.`
          );
        }

        this.actionNames.add(fullPath);
      }
    });
    this.controllers.push(meta);
  }
  

  // handlers
  
  public addHandler(meta: HandlerMetadata) {
    meta.methods.forEach(m => {
      if (m.handleName) {
        // We use the full string 'namespace:handle' for the check
        const fullPath = `${meta.namespace}:${m.handleName}`;

        if (this.handleNames.has(fullPath)) {
          throw new Error(
            `HexaJS Build Error: Duplicate Handle path "${fullPath}" found. ` +
            `Check class ${meta.className}. Handles must be unique across the entire context.`
          );
        }

        this.handleNames.add(fullPath);
      }
    });
    this.handlers.push(meta);
  }

  public getServices() {
    return Array.from(this.services.values());
  }

  public getControllers() {
    return this.controllers;
  }

  public getHandlers() {
    return this.handlers;
  }

  public getContentEntries() {
    return Array.from(this.contentEntries.values());
  }

  // Workers
  public addWorker(meta: WorkerMetadata) {
    if (this.workers.has(meta.name)) {
      throw new Error(
        `HexaJS Build Error: Duplicate @Worker name "${meta.name}" found in class "${meta.className}". ` +
        `Worker names must be unique across the entire application.`
      );
    }
    this.workers.set(meta.name, meta);
  }

  public getWorkers(): WorkerMetadata[] {
    return Array.from(this.workers.values());
  }

  // States
  public addState(meta: StateMetadata) {
    if (this.states.has(meta.context)) {
      throw new Error(
        `HexaJS Build Error: Duplicate @State for context "${meta.context}". ` +
        `Only one @State configuration per context is allowed.`
      );
    }
    this.states.set(meta.context, meta);
  }

  public getState(context: string): StateMetadata | undefined {
    return this.states.get(context);
  }

  public getStates() {
    return Array.from(this.states.values());
  }

  // Tokens
  public addToken(meta: TokenMetadata) {
    if (RESERVED_FRAMEWORK_TOKEN_KEYS.has(meta.key)) {
      throw new Error(
        `HexaJS Build Error: Token key "${meta.key}" is reserved by the framework and cannot be redefined by user code.`
      );
    }
    if (this.tokens.has(meta.key)) {
      throw new Error(
        `HexaJS Build Error: Duplicate token key "${meta.key}" found. ` +
        `Token keys must be unique across the entire application.`
      );
    }
    this.tokens.set(meta.key, meta);
  }

  public getToken(key: string): TokenMetadata | undefined {
    return this.tokens.get(key);
  }

  public getTokens(): TokenMetadata[] {
    return Array.from(this.tokens.values());
  }

  public getTokensByContext(context: string): TokenMetadata[] {
    return this.getTokens().filter(t => t.context === context || t.context === 'general');
  }

  public addDtoValidation(meta: DtoValidationMetadata) {
    if (this.dtoValidations.has(meta.className)) {
      throw new Error(
        `HexaJS Build Error: Duplicate DTO validation metadata for class "${meta.className}" found.`
      );
    }
    this.dtoValidations.set(meta.className, meta);
  }

  public getDtoValidation(name: string): DtoValidationMetadata | undefined {
    return this.dtoValidations.get(name);
  }

  public getDtoValidations(): DtoValidationMetadata[] {
    return Array.from(this.dtoValidations.values());
  }

  public setPackageMetadata(packageMetadata: PackageMetadata) {
    this.packageMetadata = packageMetadata;
  }

  public getPackageMetadata(): PackageMetadata {
    return this.packageMetadata;
  }

  // Views
  public addView(meta: ViewMetadata) {
    if (this.views.has(meta.className)) {
      throw new Error(
        `HexaJS Build Error: Duplicate @View class "${meta.className}" found. ` +
        `View class names must be unique across the entire application.`
      );
    }
    if (this.viewIds.has(meta.id)) {
      throw new Error(
        `HexaJS Build Error: Duplicate @View id "${meta.id}" found in class "${meta.className}". ` +
        `View ids must be unique across the entire application.`
      );
    }
    this.viewIds.add(meta.id);
    this.views.set(meta.className, meta);
  }

  public getViews(): ViewMetadata[] {
    return Array.from(this.views.values());
  }

  public getView(className: string): ViewMetadata | undefined {
    return this.views.get(className);
  }
}
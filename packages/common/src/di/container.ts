import { getInjectMetadata } from './metadata';

export type Factory<T> = (container: Container) => T;
type ClassToken<T = unknown> = abstract new (...args: any[]) => T;

export class Container {
  private providers = new Map<any, Factory<any>>();
  private instances = new Map<any, any>();
  private resolving = new Set<any>();

  register<T>(token: any, factory: Factory<T>): this {
    this.providers.set(token, factory);
    return this;
  }

  resolve<T>(token: any): T {
    if (this.instances.has(token)) return this.instances.get(token);

    const factory = this.providers.get(token)
      ?? this._autoFactory(token);

    if (!factory) {
      const label = typeof token === 'string' ? token : (token?.name ?? String(token));
      throw new Error(`DI Error: No provider for ${label}.`);
    }

    if (this.resolving.has(token)) {
      const label = typeof token === 'string' ? token : (token?.name ?? String(token));
      throw new Error(`DI Error: Circular dependency detected while resolving ${label}.`);
    }

    this.resolving.add(token);
    try {
      const instance = factory(this);
      this.instances.set(token, instance);
      return instance;
    } finally {
      this.resolving.delete(token);
    }
  }

  /**
   * If `token` is a class constructor decorated with @Injectable, build a
   * factory automatically by reading its internal injection metadata.
   */
  private _autoFactory<T>(token: any): Factory<T> | undefined {
    if (typeof token !== 'function') return undefined;
    const injects = getInjectMetadata(token);
    return (c: Container) => {
      const args = injects.map((dep) => dep !== undefined ? c.resolve(dep) : undefined);
      return new (token as any)(...args);
    };
  }
}

// ── Global inject API ────────────────────────────────────────────────────────
// Each context (background / content / UI) runs in its own JS runtime.
// The generated bootstrap file calls `setContainer()` to wire the container
// for that context. `inject()` then resolves from the correct container.

let _container: Container | null = null;

/**
 * Sets the global DI container for the current context.
 * Called by the generated bootstrap files — not intended for direct use.
 * @internal
 */
export function setContainer(container: Container): void {
  _container = container;
}

/**
 * Resolves a service or token from the DI container of the current context.
 *
 * Each runtime context (background service worker, content script, UI page)
 * has its own container — set automatically by the generated bootstrap.
 * Calling `inject()` before the bootstrap runs throws a clear error.
 *
 * @param token — A class constructor (e.g. `DevtoolsPort`) or a string token key.
 * @returns The resolved instance.
 *
 * @example
 * ```ts
 * import { inject } from '@hexajs/common';
 * import { DevtoolsPort } from '@hexajs/ports';
 *
 * const devtools = inject(DevtoolsPort);
 * ```
 */
export function inject<C extends ClassToken>(token: C): InstanceType<C>;
export function inject<T = unknown>(token: string): T;
export function inject<T>(token: ClassToken<T> | string): T {
  if (!_container) {
    throw new Error(
      '[HexaJS] inject() called before the DI container was initialized. ' +
      'Make sure the HexaJS build has run and the bootstrap is loaded.'
    );
  }
  return _container.resolve<T>(token);
}

/**
 * Resolves a worker proxy from the DI container of the current context.
 *
 * Use this for on-demand worker access, for example:
 * `readonly ocrWorker = injectWorker(OcrWorker)`.
 * Prefer `@InjectWorker()` on class properties when you want build-time validation.
 */
export function injectWorker<C extends ClassToken>(token: C): InstanceType<C> {
  return inject(token);
}

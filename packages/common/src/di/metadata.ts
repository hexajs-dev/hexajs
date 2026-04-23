import type { HexaTokenRef, InjectableOptions } from './decorators';

const TOKEN_BRAND = Symbol('hexajs.token');
const INJECTABLE_METADATA = new WeakMap<object, Readonly<InjectableOptions>>();
const INJECT_METADATA = new WeakMap<object, readonly (string | undefined)[]>();
const WORKER_INJECT_METADATA = new WeakMap<object, readonly boolean[]>();

export function brandToken<T>(token: HexaTokenRef<T>): HexaTokenRef<T> {
  Object.defineProperty(token, TOKEN_BRAND, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return Object.freeze(token) as HexaTokenRef<T>;
}

export function isBrandedToken(value: unknown): value is HexaTokenRef<unknown> {
  return typeof value === 'object' && value !== null && (value as Record<PropertyKey, unknown>)[TOKEN_BRAND] === true;
}

export function setInjectableMetadata(target: object, options: InjectableOptions): void {
  INJECTABLE_METADATA.set(target, Object.freeze({ ...options }));
}

export function getInjectableMetadata(target: object): Readonly<InjectableOptions> | undefined {
  return INJECTABLE_METADATA.get(target);
}

export function getInjectMetadata(target: object): readonly (string | undefined)[] {
  return INJECT_METADATA.get(target) ?? [];
}

export function setInjectMetadata(target: object, injects: readonly (string | undefined)[]): void {
  INJECT_METADATA.set(target, Object.freeze([...injects]));
}

export function getWorkerInjectMetadata(target: object): readonly boolean[] {
  return WORKER_INJECT_METADATA.get(target) ?? [];
}

export function setWorkerInjectMetadata(target: object, injects: readonly boolean[]): void {
  WORKER_INJECT_METADATA.set(target, Object.freeze([...injects]));
}
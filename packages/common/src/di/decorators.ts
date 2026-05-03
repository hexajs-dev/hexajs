import { brandToken, getInjectMetadata, isBrandedToken, setInjectMetadata, setInjectableMetadata } from './metadata';

export enum HexaContext {
  Empty = 'empty',
  Content = 'content',
  Background = 'background',
  UI = 'ui',
}

export interface InjectableOptions {
  context?: HexaContext;
}

// At runtime, this decorator is just a "noop" or stores metadata 
// for local testing, but it is NOT used for reflection.
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return (target: any) => {
    setInjectableMetadata(target, options);
    return target;
  };
}

export interface HexaTokenRef<T> {
  key: string;
  value: T;
  context?: HexaContext;
}

export const createToken = <T>(key: string, value: T, context?: HexaContext): HexaTokenRef<T> => 
    brandToken({ key, value, context } as HexaTokenRef<T>);

export function Inject(token: string | HexaTokenRef<any>): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (typeof token !== 'string' && !isBrandedToken(token)) {
      throw new Error('[HexaJS] Inject() token objects must be created via createToken().');
    }

    // Always store the string key, regardless of whether a string or HexaTokenRef was passed
    const existingInjects = [...getInjectMetadata(target)];
    existingInjects[parameterIndex] = typeof token === 'string' ? token : token.key;
    setInjectMetadata(target, existingInjects);
  };
}

export function InjectWorker(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const ctor = target.constructor;
    const existing: string[] = ctor.__hexa_worker_property_injects__ || [];
    existing.push(String(propertyKey));
    ctor.__hexa_worker_property_injects__ = existing;
  };
}

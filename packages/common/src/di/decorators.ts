export enum InjectableContext {
  Empty = 'empty',
  Content = 'content',
  Background = 'background',
  UI = 'ui',
}

export interface InjectableOptions {
  context?: InjectableContext;
}

// At runtime, this decorator is just a "noop" or stores metadata 
// for local testing, but it is NOT used for reflection.
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return (target: any) => {
    target.__hexa_metadata__ = options;
    return target;
  };
}

export interface HexaTokenRef<T> {
  key: string;
  value: T;
  context?: InjectableContext;
}

export const createToken = <T>(key: string, value: T, context?: InjectableContext): HexaTokenRef<T> => 
    ({ __hexa_token__: true, key, value, context } as HexaTokenRef<T>);

export function Inject(token: string | HexaTokenRef<any>): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    // Always store the string key, regardless of whether a string or HexaTokenRef was passed
    const existingInjects = target.__hexa_injects__ || [];
    existingInjects[parameterIndex] = typeof token === 'string' ? token : token.key;
    target.__hexa_injects__ = existingInjects;
  };
}

export function InjectWorker(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingInjects = target.__hexa_worker_injects__ || [];
    existingInjects[parameterIndex] = true;
    target.__hexa_worker_injects__ = existingInjects;
  };
}

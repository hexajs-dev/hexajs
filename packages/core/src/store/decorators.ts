import { InjectableContext } from '@hexajs-dev/common';
import { HexaReducer } from "./reducer.abstract";

export function Reducer(): ClassDecorator {
    return (target: any) => {
        // We attach a hidden property just in case we need it for 
        // runtime sanity checks, but the CLI will mostly use the AST.
        target.__hexa_reducer__ = { type: 'reducer' };
        return target;
    };
}

export function Reduce<P>(type: string): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        target.__hexa_reductions__ = target.__hexa_reductions__ || {};
        target.__hexa_reductions__[propertyKey] = { action: type };
        return descriptor;
    };
}

export function State<T>(options: { context: InjectableContext, 
    state: { [K in keyof T]: new () => HexaReducer<T[K]> },
    effects?: Array<new (...args: any[]) => any> }): ClassDecorator {
    return (target: any) => {
        // We attach a hidden property just in case we need it for 
        // runtime sanity checks, but the CLI will mostly use the AST.
        target.__hexa_state__ = { type: 'state', options };
        return target;
    };
}







// Type helper for Content class constructors
type ContentClass = new (...args: any[]) => any;

export function Handler(options: { namespace: string; Contents?: ContentClass[]; }): ClassDecorator {
  return (target: any) => {
    // We attach a hidden property just in case we need it for 
    // runtime sanity checks, but the CLI will mostly use the AST.
    target.__hexa_handler__ = { type: 'handler', namespace: options.namespace };
    return target;
  };
}


/**
 * For Request/Response (Unary). 
 * CLI should enforce that handleName is UNIQUE per context.
 */
export function Handle(handleName: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    target.constructor.__hexa_handles__ = target.constructor.__hexa_handles__ || {};
    target.constructor.__hexa_handles__[propertyKey] = { handleName };
  };
}

/**
 * For Fire-and-Forget (Multicast).
 * Multiple methods can listen to the same eventName.
 */
export function Subscribe(eventName: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    target.constructor.__hexa_events__ = target.constructor.__hexa_events__ || {};
    target.constructor.__hexa_events__[propertyKey] = { eventName };
  };
}
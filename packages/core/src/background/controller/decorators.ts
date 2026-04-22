
export function Controller(options: { namespace: string }): ClassDecorator {
  return (target: any) => {
    // We attach a hidden property just in case we need it for 
    // runtime sanity checks, but the CLI will mostly use the AST.
    target.__hexa_controller__ = { type: 'controller', namespace: options.namespace };
    return target;
  };
}


/**
 * For Request/Response (Unary). 
 * CLI should enforce that actionName is UNIQUE per context.
 */
export function Action(actionName: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    target.constructor.__hexa_actions__ = target.constructor.__hexa_actions__ || {};
    target.constructor.__hexa_actions__[propertyKey] = { actionName };
  };
}

/**
 * For Fire-and-Forget (Multicast).
 * Multiple methods can listen to the same eventName.
 */
export function On(eventName: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    target.constructor.__hexa_events__ = target.constructor.__hexa_events__ || {};
    target.constructor.__hexa_events__[propertyKey] = { eventName };
  };
}
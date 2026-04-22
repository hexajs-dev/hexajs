


export function Background(): ClassDecorator {
  return (target: any) => {
    // We attach a hidden property just in case we need it for 
    // runtime sanity checks, but the CLI will mostly use the AST.
    target.__hexa_metadata__ = { type: 'background' };
    return target;
  };
}





export enum ContentRunAt {
  DocumentStart = 'document_start',
  DocumentEnd = 'document_end',
  DocumentIdle = 'document_idle'
}
export function Content(options: { matches: Array<string>, runAt: ContentRunAt; allFrames?: boolean; }): ClassDecorator {
  return (target: any) => {
    // We attach a hidden property just in case we need it for 
    // runtime sanity checks, but the CLI will mostly use the AST.
    target.__hexa_metadata__ = { type: 'content', options };
    return target;
  };
}
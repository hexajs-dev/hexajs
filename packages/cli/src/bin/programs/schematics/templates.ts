import { HexaRuntimeContext } from './shared';

export function contentTemplate(className: string, matches: string[], runAt: string): string {
  return `import { Content, ContentRunAt } from '@hexajs/core';
import { OnDestroy, OnInit } from '@hexajs/common';

@Content({ matches: [${matches.map(match => `'${match}'`).join(', ')}], runAt: ${runAt} })
export class ${className} implements OnInit, OnDestroy {
  onInit(): void {
    console.log('[HexaJS] ${className} initialized');
  }

  onDestroy(): void {
    console.log('[HexaJS] ${className} destroyed');
  }
}
`;
}

export function backgroundTemplate(className: string): string {
  return `import { Background } from '@hexajs/core';
import { OnDestroy, OnInit } from '@hexajs/common';

@Background()
export class ${className} implements OnInit, OnDestroy {
  onInit(): void {
    console.log('[HexaJS] ${className} initialized');
  }

  onDestroy(): void {
    console.log('[HexaJS] ${className} destroyed');
  }
}
`;
}

export function controllerTemplate(className: string, namespace: string): string {
  return `import { Action, Controller } from '@hexajs/core';

@Controller({ namespace: '${namespace}' })
export class ${className} {
  @Action('execute')
  execute(payload: unknown): { ok: boolean; payload: unknown } {
    return { ok: true, payload };
  }
}
`;
}

export function handlerTemplate(className: string, namespace: string): string {
  return `import { Handle, Handler } from '@hexajs/core';

@Handler({ namespace: '${namespace}', Contents: [] })
export class ${className} {
  @Handle('execute')
  execute(payload: unknown): { ok: boolean; payload: unknown } {
    return { ok: true, payload };
  }
}
`;
}

export function serviceTemplate(className: string, context: HexaRuntimeContext, injectableContextRef: string | null): string {
  const decorator = injectableContextRef ? `@Injectable({ context: ${injectableContextRef} })` : '@Injectable()';
  const commonImport = injectableContextRef
    ? `import { Injectable, InjectableContext } from '@hexajs/common';`
    : `import { Injectable } from '@hexajs/common';`;

  return `${commonImport}

${decorator}
export class ${className} {
  readonly context = '${context}';
}
`;
}

export function reducerTemplate(className: string, stateName: string): string {
  return `import { HexaReducer, Reducer } from '@hexajs/core';

export interface ${stateName} {
  ready: boolean;
}

@Reducer()
export class ${className} extends HexaReducer<${stateName}> {
  initialState: ${stateName} = {
    ready: false,
  };
}
`;
}

export function stateTemplate(context: 'background' | 'content', reducerImportPath: string, reducerClassName: string, reducerStateName: string, featureName: string): string {
  const rootStateName = context === 'background' ? 'BackgroundState' : 'ContentState';
  const contextRef = context === 'background' ? 'InjectableContext.Background' : 'InjectableContext.Content';
  const configClassName = context === 'background' ? 'BackgroundStateConfig' : 'ContentStateConfig';

  return `import { InjectableContext } from '@hexajs/common';
import { State } from '@hexajs/core';
import { ${reducerClassName}, ${reducerStateName} } from '${reducerImportPath}';

export interface ${rootStateName} {
  ${featureName}: ${reducerStateName};
}

@State<${rootStateName}>({
  context: ${contextRef},
  state: {
    ${featureName}: ${reducerClassName},
  },
})
export class ${configClassName} {}
`;
}
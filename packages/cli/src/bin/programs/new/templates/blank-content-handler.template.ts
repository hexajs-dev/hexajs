import type { ScaffoldContext } from '../models/scaffold.types';

export const blankContentHandlerTemplate = (ctx: ScaffoldContext): string => `\
import { Handler } from '@hexajs/core';
import { ${ctx.className}Content } from './content';

/**
 * Content handler for the "${ctx.name}" namespace.
 * Add @Handle methods here to handle messages sent from the background script.
 */
@Handler({ namespace: '${ctx.name}', Contents: [${ctx.className}Content] })
export class ${ctx.className}Handler {
	// @Handle('example')
	// onExample(payload: unknown): unknown {
	//   return payload;
	// }
}
`;

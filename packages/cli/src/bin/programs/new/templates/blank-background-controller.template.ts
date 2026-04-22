import type { ScaffoldContext } from '../models/scaffold.types';

export const blankBackgroundControllerTemplate = (ctx: ScaffoldContext): string => `\
import { Controller } from '@hexajs/core';

/**
 * Background controller for the "${ctx.name}" namespace.
 * Add @Action methods here to handle messages from content scripts and the popup.
 */
@Controller({ namespace: '${ctx.name}' })
export class ${ctx.className}Controller {
	// @Action('example')
	// onExample(payload: unknown): unknown {
	//   return payload;
	// }
}
`;

import type { ScaffoldContext } from '../models/scaffold.types';

export const blankBackgroundMainTemplate = (ctx: ScaffoldContext): string => `\
import { Background } from '@hexajs/core';
import { OnInit, OnDestroy } from '@hexajs/common';

@Background()
export class ${ctx.className}Background implements OnInit, OnDestroy {
	onInit(): void {
		console.log('[${ctx.name}] Background initialized');
	}

	onDestroy(): void {
		console.log('[${ctx.name}] Background destroyed');
	}
}
`;

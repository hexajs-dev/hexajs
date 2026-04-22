import type { ScaffoldContext } from '../models/scaffold.types';

export const blankContentTemplate = (ctx: ScaffoldContext): string => `\
import { Content, ContentRunAt } from '@hexajs/core';
import { OnInit, OnDestroy } from '@hexajs/common';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class ${ctx.className}Content implements OnInit, OnDestroy {
	onInit(): void {
		console.log('[${ctx.name}] Content script initialized on', window.location.href);
	}

	onDestroy(): void {
		console.log('[${ctx.name}] Content script destroyed');
	}
}
`;

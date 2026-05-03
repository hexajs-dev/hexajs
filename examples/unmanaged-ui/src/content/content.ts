import { Content, ContentRunAt } from '@hexajs-dev/core';
import { OnInit, OnDestroy, Inject, createToken, HexaContext } from '@hexajs-dev/common';

export const APP_NAME = createToken<string>('APP_NAME', 'unmanaged-ui');
export const PLATFORM_GREETING = 'PLATFORM_GREETING';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class UnmanagedUiContent implements OnInit, OnDestroy {
	constructor(@Inject(APP_NAME) private readonly appName: string, @Inject(PLATFORM_GREETING) private readonly platformGreeting: string) { }

	onInit(): void {
		console.log(`[${this.appName}] Content script initialized on ${window.location.href}`);
		console.log(`[${this.appName}] ${this.platformGreeting}`);
	}

	onDestroy(): void {
		console.log(`[${this.appName}] Content script destroyed`);
	}
}

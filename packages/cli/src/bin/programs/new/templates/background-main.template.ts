import type { ScaffoldContext } from '../models/scaffold.types';

export const backgroundMainTemplate = (ctx: ScaffoldContext): string => `\
import { Background, HexaBackgroundClient, HexaBackgroundStore, select } from '@hexajs/core';
import { BackgroundState } from './store/background.reducer';
import { OnDestroy, OnInit } from '@hexajs/common';
import { Subscription } from 'rxjs';

@Background()
export class ${ctx.className}Background implements OnInit, OnDestroy {
	subscriptions: Subscription = new Subscription();

	constructor(private readonly backgroundStore: HexaBackgroundStore<BackgroundState>, private readonly client: HexaBackgroundClient,) {}

	onInit(): void {
		this.subscriptions.add(
			this.backgroundStore.pipe(select(s => s.lastContentCall)).subscribe(value => {
				if (value.tabId) {
					this.sendPongToTab(value.tabId, \`pong from background at \${new Date(value.timestamp).toLocaleTimeString()}\`);
				}
			})
		);
	}

	sendPongToTab(tabId: number, message: string): void {
		this.client.sendToTab<string, string>(tabId, 'ping:ping', message).then(response => {
			console.log('Got response from content:', response);
		}).catch(err => {
			console.error('Error sending message from background:', err);
		});
	}

	onDestroy(): void | Promise<void> {
		this.subscriptions.unsubscribe();
	}
}
`;

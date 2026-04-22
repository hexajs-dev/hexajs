import type { ScaffoldContext } from '../models/scaffold.types';

export const contentTemplate = (ctx: ScaffoldContext): string => `\
import { Content, ContentRunAt, HexaContentClient, HexaContentStore, select } from '@hexajs/core';
import { ContentStateConfig } from './store/content.state';
import { ContentState } from './store/content.reducer';
import { LoggerService } from '../services/logger.service';
import { ContentPingMessage } from '../contract/start/messages';
import { OnDestroy, OnInit } from '@hexajs/common';
import { Subscription } from 'rxjs';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class ${ctx.className}Content implements OnInit, OnDestroy {
	subscriptions: Subscription = new Subscription();

	constructor(private readonly store: HexaContentStore<ContentState>, private readonly client: HexaContentClient, private readonly logger: LoggerService) {}

	/** Initiate a ping toward the background controller */
	async sendPing(): Promise<string> {
		const response = await this.client.sendMessage<ContentPingMessage, string>('ping:ping', new ContentPingMessage('hello from content', Date.now()));
		this.logger.log(\`Got response from background: \${response}\`);
		return response;
	}

	onInit(): void | Promise<void> {
		this.subscriptions.add(this.store.pipe(select(s => s.lastBackgroundCall)).subscribe(value => {
			console.log('Last background call:', value);
		}));
		this.sendPing().catch(err => this.logger.error('Error sending initial ping from content:', err));
	}

	onDestroy(): void | Promise<void> {
		this.subscriptions.unsubscribe();
	}
}
`;

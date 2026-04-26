import type { ScaffoldContext } from '../models/scaffold.types';

export const contentHandlerTemplate = (ctx: ScaffoldContext): string => `\
import { Handler, Handle, HexaContentStore } from '@hexajs-dev/core';
import { LoggerService } from '../services/logger.service';
import { ${ctx.className}Content } from './content';
import { ContentState } from './store/content.reducer';
import { backgroundCalled } from './store/content.actions';
import { ContentPongMessage } from '../contract/start/messages';

/**
 * Handles "ping" actions coming from the background script.
 * Responds with "pong from content" and records the call in the content store.
 *
 * Also exposes a \`sendPing()\` method to initiate a ping toward background
 * via the injected HexaContentClient.
 */
@Handler({ namespace: 'ping', Contents: [${ctx.className}Content] })
export class ${ctx.className}Handler {
  constructor(private readonly logger: LoggerService,
    private readonly store: HexaContentStore<ContentState>) {}

  @Handle('ping')
  onPing(payload: string): ContentPongMessage {
    this.logger.log(\`Content received ping: \${payload}\`);
    this.store.dispatch(backgroundCalled({ message: payload, timestamp: Date.now() }));
    return new ContentPongMessage('pong from content');
  }
}
`;

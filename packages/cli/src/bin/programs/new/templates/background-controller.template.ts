import type { ScaffoldContext } from '../models/scaffold.types';

export const backgroundControllerTemplate = (ctx: ScaffoldContext): string => `\
import { Controller, Action } from '@hexajs/core';
import { Inject, HEXA_PLATFORM } from '@hexajs/common';
import { HexaBackgroundClient, HexaBackgroundStore } from '@hexajs/core';
import { LoggerService } from '../services/logger.service';
import { BackgroundState } from './store/background.reducer';
import { contentCalled } from './store/background.actions';
import { BackgroundPingMessage, ContentPingMessage } from '../contract/start/messages';

/**
 * Listens for "ping" actions sent from content scripts.
 * Responds with "pong from <platform>" and records the call in the background store.
 */
@Controller({ namespace: 'ping' })
export class ${ctx.className}Controller {
  constructor(private readonly client: HexaBackgroundClient,
    private readonly logger: LoggerService,
    @Inject(HEXA_PLATFORM) private readonly platform: string,
    private readonly store: HexaBackgroundStore<BackgroundState>) {}

  @Action('ping')
  onPing(payload: ContentPingMessage, sender: webExt.runtime.MessageSender): BackgroundPingMessage {
    this.logger.log(\`Background received ping: \${payload}\`);
    this.store.dispatch(contentCalled({ ...payload, tabId: sender.tab?.id || -1 }));
    return new BackgroundPingMessage(\`pong from \${this.platform}\`, Date.now());
  }
}

@Controller({ namespace: 'popup' })
export class PopupController {
  constructor(private readonly client: HexaBackgroundClient) {}

  @Action('opened')
  onPopupOpened(payload: { timestamp: number }): void {
    console.log('Popup opened at:', payload.timestamp);
  }
}

@Controller({ namespace: 'devtools' })
export class DevtoolsController {
  constructor(private readonly client: HexaBackgroundClient) {}

  @Action('panelOpened')
  onPanelOpened(payload: { timestamp: number }): void {
    console.log('Devtools panel opened at:', payload.timestamp);
  }
}
`;

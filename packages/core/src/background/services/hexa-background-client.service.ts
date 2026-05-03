import { Injectable, HexaContext } from '@hexajs-dev/common';
import { RuntimePort, TabsPort } from '@hexajs-dev/ports';
import { HexaClientBase } from '../../services/hexa-client.base';

/**
 * Background-context HexaClient.
 * Extends the base with tab-targeted messaging and broadcast.
 */
@Injectable({ context: HexaContext.Background })
export class HexaBackgroundClient extends HexaClientBase {

    constructor(
        runtimePort: RuntimePort,
        private readonly tabsPort: TabsPort,
    ) {
        super(runtimePort);
    }

    /**
     * Send a message and await a response.
     * Content → background uses runtime.sendMessage.
     * Background → content requires a tabId — use BackgroundHexaClient.sendToTab().
     * @param target Routing key in `namespace:action` format (e.g. `'namespace:action\on'`).
     * @param payload Optional payload to send with the message.
     */
    async sendToTab<TPayload, TResponse>(tabId: number, target: `${string}:${string}`, payload?: TPayload): Promise<TResponse> {
        return this.tabsPort.sendTabMessage(tabId, { action: target, payload });
    }

    /** Broadcast a fire-and-forget message to all tabs. */
    async broadcast<TPayload>(target: `${string}:${string}`, payload?: TPayload): Promise<void> {
        return this.tabsPort.broadcastMessage({ action: target, payload });
    }

}

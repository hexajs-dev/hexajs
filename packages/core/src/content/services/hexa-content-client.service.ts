import { Injectable, InjectableContext } from '@hexajs/common';
import { RuntimePort } from '@hexajs/ports';
import { HexaClientBase } from '../../services/hexa-client.base';

/**
 * Content-context HexaClient.
 * Sends messages from the content script to the background.
 */
@Injectable({ context: InjectableContext.Content })
export class HexaContentClient extends HexaClientBase {

    constructor(runtimePort: RuntimePort) {
        super(runtimePort);
    }

}

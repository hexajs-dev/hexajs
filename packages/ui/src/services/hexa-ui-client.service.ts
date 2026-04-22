import { Injectable, InjectableContext } from '@hexajs/common';
import { HexaClientBase } from '@hexajs/core';
import { RuntimePort } from '@hexajs/ports';

/**
 * UI-context HexaClient.
 * Sends messages from popup/devtools UI to the background.
 */
@Injectable({ context: InjectableContext.UI })
export class HexaUIClient extends HexaClientBase {

    constructor(runtimePort: RuntimePort) {
        super(runtimePort);
    }

}

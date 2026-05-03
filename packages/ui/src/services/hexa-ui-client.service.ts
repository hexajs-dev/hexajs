import { Injectable, HexaContext } from '@hexajs-dev/common';
import { HexaClientBase } from '@hexajs-dev/core';
import { RuntimePort } from '@hexajs-dev/ports';

/**
 * UI-context HexaClient.
 * Sends messages from popup/devtools UI to the background.
 */
@Injectable({ context: HexaContext.UI })
export class HexaUIClient extends HexaClientBase {

    constructor(runtimePort: RuntimePort) {
        super(runtimePort);
    }

}

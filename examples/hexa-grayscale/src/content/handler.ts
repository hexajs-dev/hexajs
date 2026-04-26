import { Handler } from '@hexajs-dev/core';
import { HexaGrayscaleContent } from './content';

/**
 * Content handler for the "hexa-grayscale" namespace.
 * Add @Handle methods here to handle messages sent from the background script.
 */
@Handler({ namespace: 'hexa-grayscale', Contents: [HexaGrayscaleContent] })
export class HexaGrayscaleHandler {
	// @Handle('example')
	// onExample(payload: unknown): unknown {
	//   return payload;
	// }
}

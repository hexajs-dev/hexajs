import { Injectable, HexaContext } from '@hexajs-dev/common';

const LOGGER_PREFIX = '[hexa-grayscale]';

@Injectable({ context: HexaContext.Content })
export class LoggerService {
	log(message: string, data?: unknown): void {
		if (typeof data === 'undefined') {
			console.log(`${LOGGER_PREFIX} ${message}`);
			return;
		}
		console.log(`${LOGGER_PREFIX} ${message}`, data);
	}

	logState(enabled: boolean): void {
		// Keep state logging consistent so tutorial users can trace lifecycle changes.
		this.log('Current grayscale state', { enabled });
	}
}

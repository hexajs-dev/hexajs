import { Handle, Handler } from '@hexajs-dev/core';
import { UnmanagedUiContent } from './content';

/**
 * Content handler for the "unmanaged-ui" namespace.
 * Add @Handle methods here to handle messages sent from the background script.
 */
@Handler({ namespace: 'unmanaged-ui', Contents: [UnmanagedUiContent] })
export class UnmanagedUiHandler {
	@Handle('logOnActiveTab')
	onLogOnActiveTab(payload: { from: string; platform: string; timestamp: number; forwardedAt: number }): { status: string } {
		console.log('[unmanaged-ui] Active tab received message from background:', payload);
		return { status: 'received' };
	}
}

import { Action, Controller } from '@hexajs-dev/core';
import { TabsPort } from '@hexajs-dev/ports';

/**
 * Background controller for the "unmanaged-ui" namespace.
 * Add @Action methods here to handle messages from content scripts and the popup.
 */
@Controller({ namespace: 'unmanaged-ui' })
export class UnmanagedUiController {
	constructor(private readonly tabsPort: TabsPort) {}

	@Action('emitToActiveTab')
	async onEmitToActiveTab(payload: { source: string; platform: string; timestamp: number }): Promise<{ status: string; tabId?: number }> {
		const tabs = await this.tabsPort.queryTabs({ active: true, currentWindow: true });
		const activeTab = tabs.find(tab => typeof tab.id === 'number');

		if (!activeTab?.id) {
			return { status: 'no-active-tab' };
		}

		await this.tabsPort.emitTabMessage(activeTab.id, {
			action: 'unmanaged-ui:logOnActiveTab',
			payload: {
				from: payload.source,
				platform: payload.platform,
				timestamp: payload.timestamp,
				forwardedAt: Date.now(),
			},
		});

		return { status: 'forwarded', tabId: activeTab.id };
	}
}

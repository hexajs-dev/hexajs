import { Injectable, InjectableContext } from '@hexajs/common';
import { TabsPort } from '@hexajs/ports';
import { ClippingCompleteMessage } from '@contract/messages/messages';
import { ClipperImageCropService } from './clipper-image-crop.service';
import { ClipperCapturedImage } from './clipper-session.service';

@Injectable({ context: InjectableContext.Background })
export class ClipperCaptureService {
	constructor(private readonly cropService: ClipperImageCropService, private tabsPort: TabsPort) {}

	async captureAndCropActiveTab(payload: ClippingCompleteMessage, senderTabId?: number): Promise<ClipperCapturedImage> {
		let currentTab: HexaWebTab | undefined;
		if (typeof senderTabId === 'number') {
			currentTab = await this.tabsPort.getTab(senderTabId);
		}
		if (!currentTab) {
			const tabs = await this.tabsPort.queryTabs({ active: true, currentWindow: true });
			currentTab = tabs.find(tab => typeof tab.id === 'number');
		}
		if (!currentTab?.id) {
			throw new Error('No active tab found for screenshot capture.'); 
		}

		
		const tab = currentTab as HexaWebTab & { width?: number; height?: number; windowId?: number };
		const imageDataUrl = await this.tabsPort.captureVisibleTab(tab.windowId, { format: 'png' });
		const cropped = await this.cropService.cropActiveTabImage({
			imageDataUrl,
			rect: payload.rect,
			viewportWidth: tab.width,
			viewportHeight: tab.height,
		});

		return {
			tabId: currentTab.id,
			rect: payload.rect,
			capturedAt: Date.now(),
			imageDataUrl: cropped.imageDataUrl,
			imageWidth: cropped.imageWidth,
			imageHeight: cropped.imageHeight,
		};
	}
}

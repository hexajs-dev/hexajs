import { Content, ContentRunAt, InjectView } from '@hexajs-dev/core';
import { OnDestroy } from '@hexajs-dev/common';
import { ClipperOverlayView } from './ui/clipper-overlay/clipper-overlay.view';
import { OcrStatusTooltipView } from './ui/ocr-status/ocr-status-tooltip.view';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class SmartClipperContent implements OnDestroy {
	@InjectView() clipperOverlayView!: ClipperOverlayView;
	@InjectView() ocrStatusView!: OcrStatusTooltipView;

	onDestroy(): void {
		this.ocrStatusView.dispose();
		this.clipperOverlayView.dispose();
		console.log('[smart-clipper] Content script destroyed');
	}
} 



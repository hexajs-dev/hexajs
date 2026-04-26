import { Content, ContentRunAt } from '@hexajs-dev/core';
import { OnInit, OnDestroy } from '@hexajs-dev/common';
import { GrayscaleUiService } from './ui/grayscale-ui.service';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class HexaGrayscaleContent implements OnInit, OnDestroy {
	constructor(private readonly grayscaleUi: GrayscaleUiService) {}

	onInit(): void {
		this.grayscaleUi.init();
		console.log('[hexa-grayscale] Content script initialized on', window.location.href);
	}

	onDestroy(): void {
		this.grayscaleUi.dispose();
		console.log('[hexa-grayscale] Content script destroyed');
	}  
}

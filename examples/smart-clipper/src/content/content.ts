import { Content, ContentRunAt } from '@hexajs/core';
import { OnInit, OnDestroy } from '@hexajs/common';
import { ClipperUiService } from './ui/clipper-ui.service';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class SmartClipperContent implements OnInit, OnDestroy {
	constructor(private readonly clipperUi: ClipperUiService) {}

	
	onInit(): void {
		
	}

	onDestroy(): void {
		this.clipperUi.dispose();
		console.log('[smart-clipper] Content script destroyed');
	}
} 



@Content({ matches: ['*://*.google.com/*'], runAt: ContentRunAt.DocumentIdle })
export class GoogleClipperContent implements OnInit, OnDestroy {
	constructor(private readonly clipperUi: ClipperUiService) {}

	
	onInit(): void {
		
	}

	onDestroy(): void {
		this.clipperUi.dispose();
		console.log('[smart-clipper] Content script destroyed');
	}
}


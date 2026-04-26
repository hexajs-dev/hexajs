import { Content, ContentRunAt } from '@hexajs-dev/core';
import { OnInit, OnDestroy } from '@hexajs-dev/common';
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



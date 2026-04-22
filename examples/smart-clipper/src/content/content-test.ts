import { OnInit, OnDestroy } from "@hexajs/common";
import { Content, ContentRunAt } from "@hexajs/core";
import { ClipperUiService } from "./ui/clipper-ui.service";

console.log('[smart-clipper] Content script loaded');

@Content({ matches: ['*://*.telegraph.co.uk/*'], runAt: ContentRunAt.DocumentIdle })
export class TelegraphClipperContent implements OnInit, OnDestroy {
	constructor(private readonly clipperUi: ClipperUiService) {}

	
	onInit(): void {
		 
	}

	onDestroy(): void {
		this.clipperUi.dispose();
		console.log('[smart-clipper] Content script destroyed telegraph');
	}
}
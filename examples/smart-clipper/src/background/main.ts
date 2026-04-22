import { Background } from '@hexajs/core';
import { OnInit, OnDestroy } from '@hexajs/common';

@Background()
export class SmartClipperBackground implements OnInit, OnDestroy {
	onInit(): void {
		console.log('[smart-clipper] Background initialized');
	}

	onDestroy(): void {
		console.log('[smart-clipper] Background destroyed');
	}
}

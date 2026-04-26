import { Background } from '@hexajs-dev/core';
import { OnInit, OnDestroy } from '@hexajs-dev/common';

@Background()
export class SmartClipperBackground implements OnInit, OnDestroy {
	onInit(): void {
		console.log('[smart-clipper] Background initialized');
	}

	onDestroy(): void {
		console.log('[smart-clipper] Background destroyed');
	}
}

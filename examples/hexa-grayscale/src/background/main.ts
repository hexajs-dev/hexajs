import { Background } from '@hexajs-dev/core';
import { OnInit, OnDestroy } from '@hexajs-dev/common';

@Background()
export class HexaGrayscaleBackground implements OnInit, OnDestroy {
	onInit(): void {
		console.log('[hexa-grayscale] Background initialized');
	}

	onDestroy(): void {
		console.log('[hexa-grayscale] Background destroyed');
	}
}

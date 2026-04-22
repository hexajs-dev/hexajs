import { Background } from '@hexajs/core';
import { OnInit, OnDestroy } from '@hexajs/common';

@Background()
export class HexaGrayscaleBackground implements OnInit, OnDestroy {
	onInit(): void {
		console.log('[hexa-grayscale] Background initialized');
	}

	onDestroy(): void {
		console.log('[hexa-grayscale] Background destroyed');
	}
}

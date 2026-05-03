import { Background } from '@hexajs-dev/core';
import { OnInit, OnDestroy } from '@hexajs-dev/common';

@Background()
export class UnmanagedUiBackground implements OnInit, OnDestroy {
	onInit(): void {
		console.log('[unmanaged-ui] Background initialized');
	}

	onDestroy(): void {
		console.log('[unmanaged-ui] Background destroyed');
	}
}

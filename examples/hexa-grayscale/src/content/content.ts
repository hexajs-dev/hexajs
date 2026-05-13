import { OnInit, OnDestroy } from '@hexajs-dev/common';
import { Content, ContentRunAt, InjectView } from '@hexajs-dev/core';
import { GrayscaleToggleView } from './ui/grayscale-toggle/grayscale-toggle-view';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class HexaGrayscaleContent implements OnInit, OnDestroy {
	@InjectView() grayscaleToggleView!: GrayscaleToggleView;

	onInit(): void {
		if (!this.grayscaleToggleView.isMounted) {
			this.grayscaleToggleView.mount();
		}
	}

	onDestroy(): void {
		this.grayscaleToggleView.reset();
		if (this.grayscaleToggleView.isMounted) {
			this.grayscaleToggleView.unmount();
		}
	}
}

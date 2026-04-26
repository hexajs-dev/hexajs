import { Injectable, InjectableContext } from '@hexajs-dev/common';
import { InjectView } from '@hexajs-dev/core';
import { GrayscaleToggleView } from './grayscale-toggle/grayscale-toggle-view';

const HEXA_GRAYSCALE_CLASS = 'hexa-grayscale-enabled';
const HEXA_GRAYSCALE_STYLE_ID = 'hexa-grayscale-page-style';

@Injectable({ context: InjectableContext.Content })
export class GrayscaleUiService {
	@InjectView() grayscaleToggleView!: GrayscaleToggleView;

	private enabled = false;

	init(): void {
		this.ensurePageStyle();
		if (!this.grayscaleToggleView.isMounted) {
			this.grayscaleToggleView.mount();
		}
		this.grayscaleToggleView.setEnabled(this.enabled);
		this.grayscaleToggleView.setOnToggle((nextEnabled: boolean) => {
			this.setEnabled(nextEnabled);
		});
	}
 
	dispose(): void {
		this.grayscaleToggleView.setOnToggle(undefined);
		if (this.grayscaleToggleView.isMounted) {
			this.grayscaleToggleView.unmount();
		}
		this.removePageStyle();
		document.documentElement.classList.remove(HEXA_GRAYSCALE_CLASS);
		this.enabled = false;
	}

	private setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		document.documentElement.classList.toggle(HEXA_GRAYSCALE_CLASS, enabled);
		this.grayscaleToggleView.setEnabled(enabled);
	}

	private ensurePageStyle(): void {
		if (document.getElementById(HEXA_GRAYSCALE_STYLE_ID)) {
			return;
		}
		const styleElement = document.createElement('style');
		styleElement.id = HEXA_GRAYSCALE_STYLE_ID;
		styleElement.textContent = `html.${HEXA_GRAYSCALE_CLASS} { filter: grayscale(100%); }`;
		document.head.appendChild(styleElement);
	}

	private removePageStyle(): void {
		document.getElementById(HEXA_GRAYSCALE_STYLE_ID)?.remove();
	}
}
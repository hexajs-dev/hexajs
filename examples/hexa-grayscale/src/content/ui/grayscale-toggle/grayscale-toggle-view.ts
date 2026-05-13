import { HexaView, View } from '@hexajs-dev/core';
import { GrayscaleToggleComponent } from './grayscale-toggle.component';
import styles from './grayscale-toggle.css?inline';

const HEXA_GRAYSCALE_CLASS = 'hexa-grayscale-enabled';
const HEXA_GRAYSCALE_STYLE_ID = 'hexa-grayscale-page-style';

@View({ id: 'hexa-grayscale-toggle', component: GrayscaleToggleComponent, styles, anchorSelector: 'body' })
export class GrayscaleToggleView extends HexaView {
	private enabled = false;

	isEnabled(): boolean {
		return this.enabled;
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		if (enabled) {
			this.ensurePageStyle();
		}
		document.documentElement.classList.toggle(HEXA_GRAYSCALE_CLASS, enabled);
	}

	toggle = (): boolean => {
		const nextEnabled = !this.enabled;
		this.setEnabled(nextEnabled);
		return nextEnabled;
	};

	reset(): void {
		this.enabled = false;
		document.documentElement.classList.remove(HEXA_GRAYSCALE_CLASS);
		this.removePageStyle();
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
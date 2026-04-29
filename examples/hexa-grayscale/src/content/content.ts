import { OnInit, OnDestroy } from '@hexajs-dev/common';
import { Content, ContentRunAt, InjectView } from '@hexajs-dev/core';
import { LoggerService } from './services/logger.service';
import { GrayscaleToggleView } from './ui/grayscale-toggle/grayscale-toggle-view';

const HEXA_GRAYSCALE_CLASS = 'hexa-grayscale-enabled';
const HEXA_GRAYSCALE_STYLE_ID = 'hexa-grayscale-page-style';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class HexaGrayscaleContent implements OnInit, OnDestroy {
	@InjectView() grayscaleToggleView!: GrayscaleToggleView;

	private enabled = false;

	constructor(private readonly logger: LoggerService) {}

	onInit(): void {
		// Inject the page-level grayscale rule once per content lifecycle.
		this.ensurePageStyle();
		if (!this.grayscaleToggleView.isMounted) {
			// Mount the shadow-DOM toggle only once to avoid duplicate UI.
			this.grayscaleToggleView.mount();
		}
		// Keep the view and DOM state aligned from the initial render.
		this.grayscaleToggleView.setEnabled(this.enabled);
		this.grayscaleToggleView.setOnToggle((nextEnabled: boolean) => {
			this.setEnabled(nextEnabled);
		});
		this.logger.log('Content script initialized on', window.location.href);
		this.logger.logState(this.enabled);
	}

	onDestroy(): void {
		// Detach callback first so the unmounted view cannot trigger updates.
		this.grayscaleToggleView.setOnToggle(undefined);
		if (this.grayscaleToggleView.isMounted) {
			this.grayscaleToggleView.unmount();
		}
		this.removePageStyle();
		document.documentElement.classList.remove(HEXA_GRAYSCALE_CLASS);
		this.enabled = false;
		this.logger.logState(this.enabled);
		this.logger.log('Content script destroyed');
	}

	private setEnabled(enabled: boolean): void {
		// Single source of truth for DOM class, view state, and logs.
		this.enabled = enabled;
		document.documentElement.classList.toggle(HEXA_GRAYSCALE_CLASS, enabled);
		this.grayscaleToggleView.setEnabled(enabled);
		this.logger.logState(enabled);
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

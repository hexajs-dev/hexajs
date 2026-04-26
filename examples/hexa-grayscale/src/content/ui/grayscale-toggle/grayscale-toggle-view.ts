import { HexaView, View } from '@hexajs-dev/core';
import { GrayscaleToggleComponent } from './grayscale-toggle.component';
import styles from './grayscale-toggle.css?inline';

interface GrayscaleToggleState {
	enabled: boolean;
}

type ToggleListener = () => void;
type ToggleHandler = (enabled: boolean) => void;

@View({ id: 'hexa-grayscale-toggle', component: GrayscaleToggleComponent, styles, anchorSelector: 'body' })
export class GrayscaleToggleView extends HexaView {
	private listeners = new Set<ToggleListener>();
	private onToggle?: ToggleHandler;
	private state: GrayscaleToggleState = {
		enabled: false
	};

	subscribe(listener: ToggleListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	getSnapshot(): GrayscaleToggleState {
		return this.state;
	}

	setEnabled(enabled: boolean): void {
		this.setState({ enabled });
	}

	setOnToggle(onToggle?: ToggleHandler): void {
		this.onToggle = onToggle;
	}

	toggle = (): void => {
		const next = !this.state.enabled;
		this.onToggle?.(next);
	};

	private setState(nextState: GrayscaleToggleState): void {
		this.state = nextState;
		this.listeners.forEach((listener) => listener());
	}
}
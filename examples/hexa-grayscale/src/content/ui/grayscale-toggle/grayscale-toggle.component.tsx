import React, { useSyncExternalStore } from 'react';
import { GrayscaleToggleView } from './grayscale-toggle-view';

interface GrayscaleToggleComponentProps {
	controller: GrayscaleToggleView;
}

function EyeOpenIcon(): JSX.Element {
	return (
		<svg viewBox='0 0 24 24' aria-hidden='true'>
			<path fill='currentColor' d='M12 6.25c4.09 0 7.36 2.5 8.85 5.75c-1.49 3.25-4.76 5.75-8.85 5.75S4.64 15.25 3.15 12C4.64 8.75 7.91 6.25 12 6.25zm0 1.5c-3.31 0-6.02 1.96-7.35 4.25c1.33 2.29 4.04 4.25 7.35 4.25s6.02-1.96 7.35-4.25c-1.33-2.29-4.04-4.25-7.35-4.25zm0 1.75a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5z' />
		</svg>
	);
}

function EyeClosedIcon(): JSX.Element {
	return (
		<svg viewBox='0 0 24 24' aria-hidden='true'>
			<path fill='currentColor' d='M3.78 4.84L2.72 5.9l3.11 3.11A11.81 11.81 0 0 0 2.9 12c1.7 3.43 5.15 5.75 9.1 5.75c1.66 0 3.23-.41 4.62-1.14l3.76 3.76l1.06-1.06L3.78 4.84zm8.22 3.41c3.31 0 6.02 1.96 7.35 4.25a9.38 9.38 0 0 1-3.73 3.69l-1.24-1.24a3.99 3.99 0 0 0-5.32-5.32L7.8 8.37a9.06 9.06 0 0 1 4.2-1.12zm-.04 3.26l2.53 2.53A2.5 2.5 0 0 1 9.46 9.1l2.5 2.41z' />
		</svg>
	);
}

export function GrayscaleToggleComponent({ controller }: GrayscaleToggleComponentProps): JSX.Element {
	const state = useSyncExternalStore(
		(onStoreChange) => controller.subscribe(onStoreChange),
		() => controller.getSnapshot()
	);

	const iconLabel = state.enabled ? 'Disable grayscale' : 'Enable grayscale';

	return (
		<button
			type='button'
			className='hexa-grayscale-toggle'
			onClick={controller.toggle}
			aria-label={iconLabel}
			title={iconLabel}
		>
			<span className='hexa-grayscale-toggle__icon'>{state.enabled ? <EyeClosedIcon /> : <EyeOpenIcon />}</span>
			<span className='hexa-grayscale-toggle__label'>{state.enabled ? 'On' : 'Off'}</span>
		</button>
	);
}
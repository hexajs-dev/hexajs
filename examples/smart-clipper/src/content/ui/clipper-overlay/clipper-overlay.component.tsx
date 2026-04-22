import React, { useSyncExternalStore } from 'react';
import { ClipperOverlayView } from './clipper-overlay.view';

interface ClipperOverlayProps {
    controller: ClipperOverlayView;
}

export function ClipperOverlayComponent({ controller }: ClipperOverlayProps): JSX.Element | null {
    const state = useSyncExternalStore(
        (onStoreChange) => controller.subscribe(onStoreChange),
        () => controller.getSnapshot()
    );

    if (!state.visible) {
        return null;
    }

    return (
        <div className='hexa-clipper-overlay'>
            <div className='hexa-clipper-overlay__dim' />
            <div className='hexa-clipper-overlay__tooltip' style={{ top: `${state.tooltipY}px`, left: `${state.tooltipX}px` }}>
                Click and drag to select area {'\u2022'} Esc or right-click to cancel
            </div>
            {state.selectionVisible ? (
                <div
                    className='hexa-clipper-overlay__rect'
                    style={{
                        left: `${state.rectX}px`,
                        top: `${state.rectY}px`,
                        width: `${state.rectWidth}px`,
                        height: `${state.rectHeight}px`
                    }}
                >
                    <div className='hexa-clipper-overlay__edge hexa-clipper-overlay__edge--top' />
                    <div className='hexa-clipper-overlay__edge hexa-clipper-overlay__edge--right' />
                    <div className='hexa-clipper-overlay__edge hexa-clipper-overlay__edge--bottom' />
                    <div className='hexa-clipper-overlay__edge hexa-clipper-overlay__edge--left' />
                    <div className='hexa-clipper-overlay__label'>{`${state.rectWidth} x ${state.rectHeight}`}</div>
                </div>
            ) : null}
        </div>
    );
}
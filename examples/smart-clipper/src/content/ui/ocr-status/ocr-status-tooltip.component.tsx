import React, { useSyncExternalStore } from 'react';
import { OcrStatusTooltipView } from './ocr-status-tooltip.view';

interface OcrStatusTooltipProps {
    controller: OcrStatusTooltipView;
}

export function OcrStatusTooltipComponent({ controller }: OcrStatusTooltipProps): JSX.Element | null {
    const state = useSyncExternalStore(
        (onStoreChange) => controller.subscribe(onStoreChange),
        () => controller.getSnapshot()
    );

    if (!state.visible) {
        return null;
    }

    return (
        <div className={`hexa-ocr-status hexa-ocr-status--${state.variant}${state.copyAction ? ' hexa-ocr-status--interactive' : ''}`}>
            {state.copyAction ? (
                <>
                    <span className="hexa-ocr-status__copy-label">Tap to copy: </span>
                    <button className="hexa-ocr-status__copy-btn" onClick={state.copyAction}>{state.message}</button>
                </>
            ) : (
                state.message
            )}
        </div>
    );
}

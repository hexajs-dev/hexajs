import { View, HexaView } from '@hexajs/core';
import { OcrStatusTooltipComponent } from './ocr-status-tooltip.component';
import styles from './ocr-status-tooltip.scss?inline';

type OcrTooltipVariant = 'progress' | 'success' | 'error';

interface OcrTooltipState {
    visible: boolean;
    variant: OcrTooltipVariant;
    message: string;
}

@View({
    id: 'smart-clipper-ocr-status',
    component: OcrStatusTooltipComponent,
    styles,
    anchorSelector: 'body'
})
export class OcrStatusTooltipView extends HexaView {
    private listeners = new Set<() => void>();
    private state: OcrTooltipState = {
        visible: false,
        variant: 'progress',
        message: ''
    };

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    getSnapshot(): OcrTooltipState {
        return this.state;
    }

    showProgress(progress: number, stage: string): void {
        const normalizedStage = stage && stage.trim().length > 0 ? stage : 'processing';
        const stageLabel = normalizedStage.charAt(0).toUpperCase() + normalizedStage.slice(1);
        this.setState({
            visible: true,
            variant: 'progress',
            message: `${stageLabel}... ${progress}%`
        });
    }

    showSuccess(text: string): void {
        const preview = text.length > 60 ? `${text.slice(0, 60)}...` : text;
        this.setState({
            visible: true,
            variant: 'success',
            message: `Copied to clipboard: ${preview}`
        });
    }

    showError(reason: string): void {
        this.setState({
            visible: true,
            variant: 'error',
            message: reason
        });
    }

    hide(): void {
     //  this.setState({
     //      ...this.state,
     //      visible: false
     //  });
    }

    private setState(nextState: OcrTooltipState): void {
        this.state = nextState;
        this.listeners.forEach(listener => listener());
    }
}

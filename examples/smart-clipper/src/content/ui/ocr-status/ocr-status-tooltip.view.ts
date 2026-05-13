import { View, HexaView } from '@hexajs-dev/core';
import { OcrStatusTooltipComponent } from './ocr-status-tooltip.component';
import styles from './ocr-status-tooltip.scss?inline';

type OcrTooltipVariant = 'progress' | 'success' | 'error';

interface OcrTooltipState {
    visible: boolean;
    variant: OcrTooltipVariant;
    message: string;
    copyAction: (() => void) | null;
}

const DEFAULT_STATE: OcrTooltipState = {
    visible: false,
    variant: 'progress',
    message: '',
    copyAction: null
};

@View({
    id: 'smart-clipper-ocr-status',
    component: OcrStatusTooltipComponent,
    styles,
    anchorSelector: 'body'
})
export class OcrStatusTooltipView extends HexaView {
    private listeners = new Set<() => void>();
    private state: OcrTooltipState = { ...DEFAULT_STATE };
    private dismissTimer: ReturnType<typeof setTimeout> | null = null;

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
        this.clearDismissTimer();
        this.ensureMounted();
        const normalizedStage = stage && stage.trim().length > 0 ? stage : 'processing';
        const stageLabel = normalizedStage.charAt(0).toUpperCase() + normalizedStage.slice(1);
        this.setState({
            visible: true,
            variant: 'progress',
            message: `${stageLabel}... ${progress}%`,
            copyAction: null
        });
    }

    showSuccess(text: string): void {
        this.clearDismissTimer();
        this.ensureMounted();
        const preview = text.length > 60 ? `${text.slice(0, 60)}...` : text;
        this.setState({
            visible: true,
            variant: 'success',
            message: `Copied to clipboard: ${preview}`,
            copyAction: null
        });
        this.scheduleDismiss(3000);
    }

    showCopyPrompt(text: string, onCopy: () => void): void {
        this.clearDismissTimer();
        this.ensureMounted();
        const preview = text.length > 60 ? `${text.slice(0, 60)}...` : text;
        this.setState({
            visible: true,
            variant: 'success',
            message: preview,
            copyAction: onCopy
        });
    }

    showError(reason: string): void {
        this.clearDismissTimer();
        this.ensureMounted();
        this.setState({
            visible: true,
            variant: 'error',
            message: reason,
            copyAction: null
        });
        this.scheduleDismiss(4000);
    }

    hide(): void {
       this.clearDismissTimer();
       this.setState({
           ...this.state,
           visible: false
       });
    }

    dispose(): void {
        this.clearDismissTimer();
        this.setState({ ...DEFAULT_STATE });
        if (this.isMounted) {
            this.unmount();
        }
    }

    private setState(nextState: OcrTooltipState): void {
        this.state = nextState;
        this.listeners.forEach(listener => listener());
    }

    private ensureMounted(): void {
        if (!this.isMounted) {
            this.mount();
        }
    }

    private clearDismissTimer(): void {
        if (this.dismissTimer) {
            clearTimeout(this.dismissTimer);
            this.dismissTimer = null;
        }
    }

    private scheduleDismiss(ms: number): void {
        this.dismissTimer = setTimeout(() => {
            this.setState({ ...DEFAULT_STATE });
            if (this.isMounted) {
                this.unmount();
            }
            this.dismissTimer = null;
        }, ms);
    }
}

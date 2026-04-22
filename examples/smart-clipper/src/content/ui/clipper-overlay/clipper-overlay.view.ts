import { View, HexaView } from '@hexajs/core';
import { ClipperOverlayComponent } from './clipper-overlay.component';
import styles from './clipper-overlay.scss?inline';

interface ClipperOverlayState {
    visible: boolean;
    selectionVisible: boolean;
    tooltipX: number;
    tooltipY: number;
    rectX: number;
    rectY: number;
    rectWidth: number;
    rectHeight: number;
}

@View({
    id: 'smart-clipper-overlay',
    component: ClipperOverlayComponent,
    styles,
    anchorSelector: 'body'
})
export class ClipperOverlayView extends HexaView {
    private listeners = new Set<() => void>();
    private state: ClipperOverlayState = {
        visible: false,
        selectionVisible: false,
        tooltipX: 20,
        tooltipY: 20,
        rectX: 0,
        rectY: 0,
        rectWidth: 0,
        rectHeight: 0
    };

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    getSnapshot(): ClipperOverlayState {
        return this.state;
    }

    show(): void {
        this.setState({
            ...this.state,
            visible: true,
            selectionVisible: false,
            rectX: 0,
            rectY: 0,
            rectWidth: 0,
            rectHeight: 0
        });
    }

    hide(): void {
        this.setState({
            ...this.state,
            visible: false,
            selectionVisible: false
        });
    }

    moveTooltip(x: number, y: number): void {
        this.setState({
            ...this.state,
            tooltipX: Math.max(8, x + 14),
            tooltipY: Math.max(8, y + 14)
        });
    }

    setSelectionRect(x: number, y: number, width: number, height: number): void {
        this.setState({
            ...this.state,
            selectionVisible: true,
            rectX: x,
            rectY: y,
            rectWidth: width,
            rectHeight: height
        });
    }

    private setState(nextState: ClipperOverlayState): void {
        this.state = nextState;
        this.listeners.forEach(listener => listener());
    }
}
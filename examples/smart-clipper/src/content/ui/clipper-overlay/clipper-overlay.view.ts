import { View, HexaView } from '@hexajs-dev/core';
import { ClipperPoint, ClipperRect, ClippingCancelledMessage, ClippingCompleteMessage, PopupStartClippingMessage, StartClippingAckMessage } from '@contract/messages/messages';
import { ClipperOverlayComponent } from './clipper-overlay.component';
import styles from './clipper-overlay.scss?inline';

export interface ClipperOverlayBridge {
    onComplete: (payload: ClippingCompleteMessage) => void;
    onCancelled: (payload: ClippingCancelledMessage) => void;
}

type ClipperMode = 'idle' | 'armed' | 'dragging';

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

const DEFAULT_STATE: ClipperOverlayState = {
    visible: false,
    selectionVisible: false,
    tooltipX: 20,
    tooltipY: 20,
    rectX: 0,
    rectY: 0,
    rectWidth: 0,
    rectHeight: 0
};

@View({
    id: 'smart-clipper-overlay',
    component: ClipperOverlayComponent,
    styles,
    anchorSelector: 'body'
})
export class ClipperOverlayView extends HexaView {
    private listeners = new Set<() => void>();
    private state: ClipperOverlayState = { ...DEFAULT_STATE };
    private mode: ClipperMode = 'idle';
    private startPoint: ClipperPoint | null = null;
    private endPoint: ClipperPoint | null = null;
    private bridge: ClipperOverlayBridge | null = null;
    private startPayload: PopupStartClippingMessage | null = null;

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    getSnapshot(): ClipperOverlayState {
        return this.state;
    }

    startClipping(payload: PopupStartClippingMessage, bridge: ClipperOverlayBridge): StartClippingAckMessage {
        if (this.mode !== 'idle') {
            return new StartClippingAckMessage('already-active');
        }

        this.bridge = bridge;
        this.startPayload = payload;
        if (!this.isMounted) {
            this.mount();
        }
        this.setState({ ...DEFAULT_STATE, visible: true });

        document.addEventListener('mousedown', this.onMouseDown, true);
        document.addEventListener('mousemove', this.onMouseMove, true);
        document.addEventListener('mouseup', this.onMouseUp, true);
        document.addEventListener('keydown', this.onKeyDown, true);
        document.addEventListener('contextmenu', this.onContextMenu, true);

        this.mode = 'armed';
        return new StartClippingAckMessage('armed');
    }

    dispose(): void {
        this.finishSession();
    }

    private moveTooltip(x: number, y: number): void {
        this.setState({
            ...this.state,
            tooltipX: Math.max(8, x + 14),
            tooltipY: Math.max(8, y + 14)
        });
    }

    private setSelectionRect(x: number, y: number, width: number, height: number): void {
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

    private finishSession(): void {
        document.removeEventListener('mousedown', this.onMouseDown, true);
        document.removeEventListener('mousemove', this.onMouseMove, true);
        document.removeEventListener('mouseup', this.onMouseUp, true);
        document.removeEventListener('keydown', this.onKeyDown, true);
        document.removeEventListener('contextmenu', this.onContextMenu, true);

        this.mode = 'idle';
        this.startPoint = null;
        this.endPoint = null;
        this.bridge = null;
        this.startPayload = null;
        this.setState({ ...DEFAULT_STATE });

        if (this.isMounted) {
            this.unmount();
        }
    }

    private readonly onMouseDown = (event: MouseEvent): void => {
        if (this.mode !== 'armed' || event.button !== 0) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.mode = 'dragging';
        this.startPoint = new ClipperPoint(event.clientX, event.clientY);
        this.endPoint = new ClipperPoint(event.clientX, event.clientY);
        this.updateSelectionBox();
    };

    private readonly onMouseMove = (event: MouseEvent): void => {
        if (this.mode === 'armed') {
            this.moveTooltip(event.clientX, event.clientY);
            return;
        }

        if (this.mode !== 'dragging') {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.endPoint = new ClipperPoint(event.clientX, event.clientY);
        this.updateSelectionBox();
    };

    private readonly onMouseUp = (event: MouseEvent): void => {
        if (this.mode !== 'dragging' || event.button !== 0 || !this.startPoint || !this.endPoint) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.endPoint = new ClipperPoint(event.clientX, event.clientY);
        const rect = this.normalizeRect(this.startPoint, this.endPoint);
        const payload = new ClippingCompleteMessage(this.startPoint, this.endPoint, rect, Date.now(), this.startPayload?.ocrLanguage);
        this.bridge?.onComplete(payload);
        this.finishSession();
    };

    private readonly onKeyDown = (event: KeyboardEvent): void => {
        if (this.mode === 'idle' || event.key !== 'Escape') {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const payload = new ClippingCancelledMessage('escape', Date.now(), this.endPoint ?? this.startPoint ?? undefined);
        this.bridge?.onCancelled(payload);
        this.finishSession();
    };

    private readonly onContextMenu = (event: MouseEvent): void => {
        if (this.mode === 'idle') {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const point = new ClipperPoint(event.clientX, event.clientY);
        const payload = new ClippingCancelledMessage('right-click', Date.now(), point);
        this.bridge?.onCancelled(payload);
        this.finishSession();
    };

    private updateSelectionBox(): void {
        if (!this.startPoint || !this.endPoint) {
            return;
        }

        const rect = this.normalizeRect(this.startPoint, this.endPoint);
        this.setSelectionRect(rect.x, rect.y, rect.width, rect.height);
        this.moveTooltip(rect.x + rect.width, rect.y + rect.height);
    }

    private normalizeRect(start: ClipperPoint, end: ClipperPoint): ClipperRect {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        return new ClipperRect(x, y, width, height);
    }
}
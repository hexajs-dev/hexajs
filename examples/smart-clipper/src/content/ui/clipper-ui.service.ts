import { Injectable, HexaContext } from '@hexajs-dev/common';
import { InjectView } from '@hexajs-dev/core';
import { ClipperPoint, ClipperRect, ClippingCancelledMessage, ClippingCompleteMessage, PopupStartClippingMessage, StartClippingAckMessage } from '@contract/messages/messages';
import { ClipperOverlayView } from './clipper-overlay/clipper-overlay.view';
import { OcrStatusTooltipView } from './ocr-status/ocr-status-tooltip.view';

interface ClipperUiBridge {
    onComplete: (payload: ClippingCompleteMessage) => void;
    onCancelled: (payload: ClippingCancelledMessage) => void;
}

@Injectable({ context: HexaContext.Content })
export class ClipperUiService {
    private mode: 'idle' | 'armed' | 'dragging' = 'idle';
    private startPoint: ClipperPoint | null = null;
    private endPoint: ClipperPoint | null = null;
    private bridge: ClipperUiBridge | null = null;
    private ocrDismissTimer: ReturnType<typeof setTimeout> | null = null;
    private startPayload: PopupStartClippingMessage | null = null;

    @InjectView() ocrStatusView!: OcrStatusTooltipView;
    @InjectView() clipperOverlayView!: ClipperOverlayView;

    startClipping(payload: PopupStartClippingMessage, bridge: ClipperUiBridge): StartClippingAckMessage {
        if (this.mode !== 'idle') {
            return new StartClippingAckMessage('already-active');
        }
        this.bridge = bridge;
        this.startPayload = payload;
        this.mountOverlay();
        this.mode = 'armed';
        return new StartClippingAckMessage('armed');
    }

    dispose(): void {
        this.clearOcrDismissTimer();
        this.ocrStatusView.hide();
        this.ocrStatusView.unmount();
        this.unmountOverlay();
    }

    private mountOverlay(): void {
        if (!this.clipperOverlayView.isMounted) {
            this.clipperOverlayView.mount();
        }
        this.clipperOverlayView.show();

        document.addEventListener('mousedown', this.onMouseDown, true);
        document.addEventListener('mousemove', this.onMouseMove, true);
        document.addEventListener('mouseup', this.onMouseUp, true);
        document.addEventListener('keydown', this.onKeyDown, true);
        document.addEventListener('contextmenu', this.onContextMenu, true);
    }

    private unmountOverlay(): void {
        document.removeEventListener('mousedown', this.onMouseDown, true);
        document.removeEventListener('mousemove', this.onMouseMove, true);
        document.removeEventListener('mouseup', this.onMouseUp, true);
        document.removeEventListener('keydown', this.onKeyDown, true);
        document.removeEventListener('contextmenu', this.onContextMenu, true);
        this.clipperOverlayView.hide();
        if (this.clipperOverlayView.isMounted) {
            this.clipperOverlayView.unmount();
        }
        this.startPoint = null;
        this.endPoint = null;
        this.bridge = null;
        this.startPayload = null;
        this.mode = 'idle';
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
            this.updateTooltipPosition(event.clientX, event.clientY);
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
        this.unmountOverlay();
    };

    private readonly onKeyDown = (event: KeyboardEvent): void => {
        if (this.mode === 'idle' || event.key !== 'Escape') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const payload = new ClippingCancelledMessage('escape', Date.now(), this.endPoint ?? this.startPoint ?? undefined);
        this.bridge?.onCancelled(payload);
        this.unmountOverlay();
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
        this.unmountOverlay();
    };

    private updateTooltipPosition(x: number, y: number): void {
        this.clipperOverlayView.moveTooltip(x, y);
    }
 
    private updateSelectionBox(): void {
        if (!this.startPoint || !this.endPoint) {
            return;
        }
        const rect = this.normalizeRect(this.startPoint, this.endPoint);
        this.clipperOverlayView.setSelectionRect(rect.x, rect.y, rect.width, rect.height);
        this.updateTooltipPosition(rect.x + rect.width, rect.y + rect.height);
    }

    private normalizeRect(start: ClipperPoint, end: ClipperPoint): ClipperRect {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        return new ClipperRect(x, y, width, height);
    }

    updateOcrProgress(progress: number, stage: string): void {
        this.clearOcrDismissTimer();
        this.ensureOcrTooltipMounted();
        this.ocrStatusView.showProgress(progress, stage);
    }

    showOcrSuccess(text: string): void {
        this.ensureOcrTooltipMounted();
        this.ocrStatusView.showSuccess(text);
        this.scheduleOcrDismiss(3000);
    }

    showOcrCopyPrompt(text: string, onCopy: () => void): void {
        this.ensureOcrTooltipMounted();
        this.ocrStatusView.showCopyPrompt(text, onCopy);
        // No auto-dismiss — user must tap to copy first
    }

    showOcrError(reason: string): void {
        this.ensureOcrTooltipMounted();
        this.ocrStatusView.showError(reason);
        this.scheduleOcrDismiss(4000);
    }

    private ensureOcrTooltipMounted(): void {
        if (!this.ocrStatusView.isMounted) {
            this.ocrStatusView.mount();
        }
    }

    private clearOcrDismissTimer(): void {
        if (this.ocrDismissTimer) {
            clearTimeout(this.ocrDismissTimer);
            this.ocrDismissTimer = null;
        }
    }

    private scheduleOcrDismiss(ms: number): void {
        this.clearOcrDismissTimer();
        this.ocrDismissTimer = setTimeout(() => {
            this.ocrStatusView.hide();
            this.ocrStatusView.unmount();
            this.ocrDismissTimer = null;
        }, ms);
    }
}
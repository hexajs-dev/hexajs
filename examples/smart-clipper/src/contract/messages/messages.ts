import { IsNumber, IsOptional, IsString } from '@hexajs/common';

export class ClipperPoint {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class ClipperRect {
    @IsNumber()
    x: number;

    @IsNumber()
    y: number;

    @IsNumber()
    width: number;

    @IsNumber()
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

export class PopupStartClippingMessage {
    @IsNumber()
    requestedAt: number;

    @IsString()
    source: string;

    @IsOptional()
    @IsString()
    ocrLanguage?: string;

    constructor(requestedAt: number, source: string = 'popup', ocrLanguage?: string) {
        this.requestedAt = requestedAt;
        this.source = source;
		this.ocrLanguage = ocrLanguage;
    }
}

export class StartClippingAckMessage {
    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    reason?: string;

    constructor(status: string, reason?: string) {
        this.status = status;
        this.reason = reason;
    }
}

export class ClippingCompleteMessage {
    start: ClipperPoint;
    end: ClipperPoint;
    rect: ClipperRect;

    @IsNumber()
    capturedAt: number;

    @IsOptional()
    @IsString()
    ocrLanguage?: string;

    constructor(start: ClipperPoint, end: ClipperPoint, rect: ClipperRect, capturedAt: number, ocrLanguage?: string) {
        this.start = start;
        this.end = end;
        this.rect = rect;
        this.capturedAt = capturedAt;
		this.ocrLanguage = ocrLanguage;
    }
}

export class ClippingCancelledMessage {
    @IsString()
    reason: string;

    @IsNumber()
    cancelledAt: number;

    @IsOptional()
    point?: ClipperPoint;

    constructor(reason: string, cancelledAt: number, point?: ClipperPoint) {
        this.reason = reason;
        this.cancelledAt = cancelledAt;
        this.point = point;
    }
}

export class OcrProgressMessage {
    @IsNumber()
    progress: number;

    @IsString()
    stage: string;

    constructor(progress: number, stage: string) {
        this.progress = progress;
        this.stage = stage;
    }
}

export class OcrCompleteMessage {
    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsNumber()
    confidence?: number;

    @IsOptional()
    @IsString()
    error?: string;

    constructor(status: string, text?: string, confidence?: number, error?: string) {
        this.status = status;
        this.text = text;
        this.confidence = confidence;
        this.error = error;
    }
}

export class PopupGetRecentClipsMessage {
    @IsNumber()
    requestedAt: number;

    @IsString()
    source: string;

    constructor(requestedAt: number, source: string = 'popup') {
        this.requestedAt = requestedAt;
        this.source = source;
    }
}

export class RecentClipItem {
    @IsNumber()
    capturedAt: number;

    @IsString()
    textPreview: string;

    @IsOptional()
    @IsNumber()
    confidence?: number;

    @IsOptional()
    @IsString()
    ocrLanguage?: string;

    constructor(capturedAt: number, textPreview: string, confidence?: number, ocrLanguage?: string) {
        this.capturedAt = capturedAt;
        this.textPreview = textPreview;
        this.confidence = confidence;
        this.ocrLanguage = ocrLanguage;
    }
}

export class RecentClipsMessage {
    clips: RecentClipItem[];

    constructor(clips: RecentClipItem[]) {
        this.clips = clips;
    }
}
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

export class DevtoolsGetStateMessage {
    @IsNumber()
    requestedAt: number;

    @IsString()
    source: string;

    constructor(requestedAt: number, source: string = 'devtools') {
        this.requestedAt = requestedAt;
        this.source = source;
    }
}

export enum DevtoolsErrorPhase {
    Capture = 'capture',
    Ocr = 'ocr',
    Unknown = 'unknown',
}

export class DevtoolsClipDiagnosticItem {
    @IsNumber()
    capturedAt: number;

    @IsString()
    textPreview: string;

    @IsString()
    fullText: string;

    @IsOptional()
    @IsNumber()
    confidence?: number;

    @IsOptional()
    @IsString()
    ocrLanguage?: string;

    @IsOptional()
    @IsNumber()
    sourceTabId?: number;

    @IsOptional()
    @IsString()
    sourceTabTitle?: string;

    @IsOptional()
    @IsString()
    sourceTabUrl?: string;

    @IsOptional()
    @IsNumber()
    imageWidth?: number;

    @IsOptional()
    @IsNumber()
    imageHeight?: number;

    @IsOptional()
    @IsNumber()
    captureDurationMs?: number;

    @IsOptional()
    @IsNumber()
    ocrDurationMs?: number;

    @IsOptional()
    @IsNumber()
    totalDurationMs?: number;

    constructor(capturedAt: number, textPreview: string, fullText: string, confidence?: number, ocrLanguage?: string, sourceTabId?: number, sourceTabTitle?: string, sourceTabUrl?: string, imageWidth?: number, imageHeight?: number, captureDurationMs?: number, ocrDurationMs?: number, totalDurationMs?: number) {
        this.capturedAt = capturedAt;
        this.textPreview = textPreview;
        this.fullText = fullText;
        this.confidence = confidence;
        this.ocrLanguage = ocrLanguage;
        this.sourceTabId = sourceTabId;
        this.sourceTabTitle = sourceTabTitle;
        this.sourceTabUrl = sourceTabUrl;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.captureDurationMs = captureDurationMs;
        this.ocrDurationMs = ocrDurationMs;
        this.totalDurationMs = totalDurationMs;
    }
}

export class DevtoolsErrorItem {
    @IsNumber()
    failedAt: number;

    @IsString()
    phase: DevtoolsErrorPhase;

    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    ocrLanguage?: string;

    @IsOptional()
    @IsNumber()
    sourceTabId?: number;

    @IsOptional()
    @IsString()
    sourceTabTitle?: string;

    @IsOptional()
    @IsString()
    sourceTabUrl?: string;

    @IsOptional()
    @IsNumber()
    captureDurationMs?: number;

    @IsOptional()
    @IsNumber()
    totalDurationMs?: number;

    constructor(failedAt: number, phase: DevtoolsErrorPhase, message: string, ocrLanguage?: string, sourceTabId?: number, sourceTabTitle?: string, sourceTabUrl?: string, captureDurationMs?: number, totalDurationMs?: number) {
        this.failedAt = failedAt;
        this.phase = phase;
        this.message = message;
        this.ocrLanguage = ocrLanguage;
        this.sourceTabId = sourceTabId;
        this.sourceTabTitle = sourceTabTitle;
        this.sourceTabUrl = sourceTabUrl;
        this.captureDurationMs = captureDurationMs;
        this.totalDurationMs = totalDurationMs;
    }
}

export class DevtoolsStateMessage {
    clips: DevtoolsClipDiagnosticItem[];
    errors: DevtoolsErrorItem[];

    constructor(clips: DevtoolsClipDiagnosticItem[], errors: DevtoolsErrorItem[]) {
        this.clips = clips;
        this.errors = errors;
    }
}

export class DevtoolsSyncClipsMessage {
    clips: DevtoolsClipDiagnosticItem[];

    constructor(clips: DevtoolsClipDiagnosticItem[]) {
        this.clips = clips;
    }
}

export class DevtoolsSyncErrorsMessage {
    errors: DevtoolsErrorItem[];

    constructor(errors: DevtoolsErrorItem[]) {
        this.errors = errors;
    }
}

export class DevtoolsSyncThemeMessage {
    @IsString()
    theme: string;

    constructor(theme: string) {
        this.theme = theme;
    }
}
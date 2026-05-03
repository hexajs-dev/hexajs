import { Injectable, HexaContext } from '@hexajs-dev/common';
import { ClipperRect } from '@contract/messages/messages';

export interface ClipperCapturedImage {
	tabId: number;
	rect: ClipperRect;
	capturedAt: number;
	imageDataUrl: string;
	imageWidth: number;
	imageHeight: number;
}

interface ClipperSessionState {
	startedAt: number;
}

@Injectable({ context: HexaContext.Background })
export class ClipperSessionService {
	private readonly sessions = new Map<number, ClipperSessionState>();
	private readonly captures = new Map<number, ClipperCapturedImage>();

	startSession(tabId: number): void {
		this.sessions.set(tabId, { startedAt: Date.now() });
	}

	isSessionActive(tabId: number): boolean {
		return this.sessions.has(tabId);
	}

	setCapturedImage(tabId: number, image: ClipperCapturedImage): void {
		this.captures.set(tabId, image);
	}

	getCapturedImage(tabId: number): ClipperCapturedImage | undefined {
		return this.captures.get(tabId);
	}

	clearSession(tabId: number): void {
		this.sessions.delete(tabId);
	}
}

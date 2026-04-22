import { Action, Controller, HexaBackgroundClient } from '@hexajs/core';
import { BackgroundActionsApi, backgroundClipprtNamespace, contentScriptApi } from '@contract/api';
import { ClippingCancelledMessage, ClippingCompleteMessage, OcrCompleteMessage, OcrProgressMessage, PopupGetRecentClipsMessage, PopupStartClippingMessage, RecentClipItem, RecentClipsMessage, StartClippingAckMessage } from '@contract/messages/messages';
import { serializeOcrLanguageSelection } from '@contract/ocr-language';
import { DownloadsPort, TabsPort, NotificationsPort, StoragePort } from '@hexajs/ports';
import { ClipperCaptureService } from './services/clipper-capture.service';
import { ClipperSessionService } from './services/clipper-session.service';
import { ClipperOcrService } from './services/clipper-ocr.service';

const RECENT_CLIPS_STORAGE_KEY = 'smart-clipper.recent-clips';
const MAX_RECENT_CLIPS = 4;
/**
 * Background controller for the "smart-clipper" namespace.
 * Add @Action methods here to handle messages from content scripts and the popup.
 */
@Controller({ namespace: backgroundClipprtNamespace })
export class SmartClipperController {
	constructor(private hexaClient: HexaBackgroundClient, private tabsPort: TabsPort, private downloadsPort: DownloadsPort, private notificationsPort: NotificationsPort, private storagePort: StoragePort, private clipperSession: ClipperSessionService, private clipperCapture: ClipperCaptureService, private clipperOcr: ClipperOcrService) {
		console.log('SmartClipperController initialized');
	}

	@Action(BackgroundActionsApi.StartClipping)
	async onStartClipping(payload: PopupStartClippingMessage): Promise<StartClippingAckMessage> {
		const tabs = await this.tabsPort.queryTabs({ active: true, currentWindow: true });
		const activeTab = tabs.find(tab => typeof tab.id === 'number');
		if (!activeTab?.id) {
			console.warn('[smart-clipper] No active tab found to start clipping.');
			return new StartClippingAckMessage('not-started', 'no-active-tab');
		}

		if (this.clipperSession.isSessionActive(activeTab.id)) {
			return new StartClippingAckMessage('already-active');
		}

		await this.hexaClient.sendToTab<PopupStartClippingMessage, StartClippingAckMessage>(activeTab.id, contentScriptApi.StartClipping, payload);
		this.clipperSession.startSession(activeTab.id);
		return new StartClippingAckMessage('armed');
	}

	@Action(BackgroundActionsApi.ClippingComplete)
	async onClippingComplete(payload: ClippingCompleteMessage, sender: webExt.runtime.MessageSender): Promise<StartClippingAckMessage> {
		const tabId = sender.tab?.id;
		try {
			const captured = await this.clipperCapture.captureAndCropActiveTab(payload, tabId);
			this.clipperSession.setCapturedImage(captured.tabId, captured);
			console.log('[smart-clipper] Selection completed with cropped image:', { senderTabId: tabId, capturedTabId: captured.tabId, payload, imageWidth: captured.imageWidth, imageHeight: captured.imageHeight });
			//await this.downloadOcrInputImage(captured.imageDataUrl);

			if (typeof tabId === 'number') {
				const ocrResult = await this.clipperOcr.recognize(captured.imageDataUrl, payload.ocrLanguage, (progress) => {
					this.hexaClient.sendToTab(tabId, contentScriptApi.OcrProgress, new OcrProgressMessage(progress.progress, progress.stage)).catch(() => {});
				});
				await this.saveRecentClip(new RecentClipItem(payload.capturedAt, this.toTextPreview(ocrResult.text), ocrResult.confidence, serializeOcrLanguageSelection(payload.ocrLanguage)));
				await this.hexaClient.sendToTab(tabId, contentScriptApi.OcrComplete, new OcrCompleteMessage('success', ocrResult.text, ocrResult.confidence));
				console.log('[smart-clipper] OCR completed:', { tabId, language: payload.ocrLanguage, confidence: ocrResult.confidence, textLength: ocrResult.text.length });
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown OCR error';
			console.error('[smart-clipper] Failed to capture/OCR active tab image:', error);
			if (typeof tabId === 'number') {
				await this.hexaClient.sendToTab(tabId, contentScriptApi.OcrComplete, new OcrCompleteMessage('error', undefined, undefined, message)).catch(() => {});
			}
		} finally {
			if (typeof tabId === 'number') {
				this.clipperSession.clearSession(tabId);
			}
		}
		return new StartClippingAckMessage('received');
	}

	@Action(BackgroundActionsApi.GetRecentClips)
	async onGetRecentClips(_payload: PopupGetRecentClipsMessage): Promise<RecentClipsMessage> {
		return new RecentClipsMessage(await this.getRecentClips());
	}

	@Action(BackgroundActionsApi.ClippingCancelled)
	onClippingCancelled(payload: ClippingCancelledMessage, sender: webExt.runtime.MessageSender): StartClippingAckMessage {
		const tabId = sender.tab?.id;
		if (typeof tabId === 'number') {
			this.clipperSession.clearSession(tabId);
		}
		console.log('[smart-clipper] Selection cancelled:', { tabId, payload });
		return new StartClippingAckMessage('received');
	}

	private async getRecentClips(): Promise<RecentClipItem[]> {
		try {
			const stored = await this.storagePort.get('local', RECENT_CLIPS_STORAGE_KEY);
			const rawClips = Array.isArray(stored[RECENT_CLIPS_STORAGE_KEY]) ? stored[RECENT_CLIPS_STORAGE_KEY] : [];
			return rawClips
				.filter((entry): entry is RecentClipItem => !!entry && typeof entry.capturedAt === 'number' && typeof entry.textPreview === 'string')
				.slice(0, MAX_RECENT_CLIPS)
				.map(entry => new RecentClipItem(entry.capturedAt, entry.textPreview, typeof entry.confidence === 'number' ? entry.confidence : undefined, typeof entry.ocrLanguage === 'string' ? entry.ocrLanguage : undefined));
		} catch (error) {
			console.warn('[smart-clipper] Failed to read recent clips from storage.', error);
			return [];
		}
	}

	private async saveRecentClip(clip: RecentClipItem): Promise<void> {
		try {
			const existing = await this.getRecentClips();
			const deduplicated = existing.filter(entry => !(entry.capturedAt === clip.capturedAt && entry.textPreview === clip.textPreview));
			const nextClips = [clip, ...deduplicated].slice(0, MAX_RECENT_CLIPS);
			await this.storagePort.set('local', { [RECENT_CLIPS_STORAGE_KEY]: nextClips });
		} catch (error) {
			console.warn('[smart-clipper] Failed to save recent clip.', error);
		}
	}

	private toTextPreview(text: string): string {
		const normalized = text.replace(/\s+/g, ' ').trim();
		if (normalized.length <= 140) {
			return normalized;
		}
		return `${normalized.slice(0, 137)}...`;
	}
}

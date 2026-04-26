import { Action, Controller, HexaBackgroundClient } from '@hexajs-dev/core';
import { BackgroundActionsApi, backgroundClipprtNamespace, contentScriptApi, devtoolsHandlesApi } from '@contract/api';
import { ClippingCancelledMessage, ClippingCompleteMessage, DevtoolsClipDiagnosticItem, DevtoolsErrorItem, DevtoolsErrorPhase, DevtoolsGetStateMessage, DevtoolsStateMessage, DevtoolsSyncClipsMessage, DevtoolsSyncErrorsMessage, OcrCompleteMessage, OcrProgressMessage, PopupGetRecentClipsMessage, PopupStartClippingMessage, RecentClipItem, RecentClipsMessage, StartClippingAckMessage } from '@contract/messages/messages';
import { DEFAULT_OCR_LANGUAGE, OCR_LANGUAGE_SELECTION_STORAGE_KEY, serializeOcrLanguageSelection } from '@contract/ocr-language';
import { CommandsPort, DownloadsPort, NotificationsPort, RuntimePort, StoragePort, TabsPort } from '@hexajs-dev/ports';
import { ClipperCaptureService } from './services/clipper-capture.service';
import { ClipperSessionService } from './services/clipper-session.service';
import { ClipperOcrService } from './services/clipper-ocr.service';

const RECENT_CLIPS_STORAGE_KEY = 'smart-clipper.recent-clips';
const DEVTOOLS_ERRORS_STORAGE_KEY = 'smart-clipper.devtools-errors';
const MAX_DEVTOOLS_CLIPS = 25;
const MAX_DEVTOOLS_ERRORS = 25;
const MAX_POPUP_RECENT_CLIPS = 4;
const START_OCR_CLIPPING_COMMAND = 'start-ocr-clipping';
/**
 * Background controller for the "smart-clipper" namespace.
 * Add @Action methods here to handle messages from content scripts and the popup.
 */
@Controller({ namespace: backgroundClipprtNamespace })
export class SmartClipperController {
	constructor(
		private hexaClient: HexaBackgroundClient,
		private tabsPort: TabsPort,
		private downloadsPort: DownloadsPort,
		private notificationsPort: NotificationsPort,
		private storagePort: StoragePort,
		private clipperSession: ClipperSessionService,
		private clipperCapture: ClipperCaptureService,
		private clipperOcr: ClipperOcrService,
		private commandsPort: CommandsPort,
		private runtimePort: RuntimePort,
	) {
		console.log('SmartClipperController initialized');
		try {
			this.commandsPort.onCommandRemoveListener(this.onCommand);
			this.commandsPort.onCommandAddListener(this.onCommand);
		} catch (error) {
			console.warn('[smart-clipper] Command shortcuts are not available in this browser context.', error);
		}
	}

	@Action(BackgroundActionsApi.StartClipping)
	async onStartClipping(payload: PopupStartClippingMessage): Promise<StartClippingAckMessage> {
		return this.startClippingOnActiveTab(payload);
	}

	private readonly onCommand = (command: string): void => {
		if (command !== START_OCR_CLIPPING_COMMAND) {
			return;
		}

		void this.startClippingFromShortcut();
	};

	private async startClippingFromShortcut(): Promise<void> {
		try {
			await this.startClippingOnActiveTab(await this.createShortcutPayload());
		} catch (error) {
			console.error('[smart-clipper] Failed to start clipping from shortcut.', error);
		}
	}

	private async createShortcutPayload(): Promise<PopupStartClippingMessage> {
		try {
			const stored = await this.storagePort.get('local', [OCR_LANGUAGE_SELECTION_STORAGE_KEY]);
			return new PopupStartClippingMessage(Date.now(), 'shortcut', serializeOcrLanguageSelection(stored[OCR_LANGUAGE_SELECTION_STORAGE_KEY] ?? DEFAULT_OCR_LANGUAGE));
		} catch (error) {
			console.warn('[smart-clipper] Failed to read OCR language selection for shortcut.', error);
			return new PopupStartClippingMessage(Date.now(), 'shortcut', serializeOcrLanguageSelection(DEFAULT_OCR_LANGUAGE));
		}
	}

	private async startClippingOnActiveTab(payload: PopupStartClippingMessage): Promise<StartClippingAckMessage> {
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
		const operationStartedAt = Date.now();
		let sessionTabId = sender.tab?.id;
		let senderTab = sender.tab as HexaWebTab | undefined;
		let captureDurationMs: number | undefined;
		let failurePhase = DevtoolsErrorPhase.Capture;
		try {
			if (typeof sessionTabId === 'number') {
				senderTab = await this.getTabSafely(sessionTabId, senderTab);
			}

			const captureStartedAt = Date.now();
			const captured = await this.clipperCapture.captureAndCropActiveTab(payload, sessionTabId);
			captureDurationMs = Date.now() - captureStartedAt;
			sessionTabId = captured.tabId;
			this.clipperSession.setCapturedImage(captured.tabId, captured);
			senderTab = await this.getTabSafely(captured.tabId, senderTab);
			console.log('[smart-clipper] Selection completed with cropped image:', { senderTabId: sender.tab?.id, capturedTabId: captured.tabId, payload, imageWidth: captured.imageWidth, imageHeight: captured.imageHeight });
			//await this.downloadOcrInputImage(captured.imageDataUrl);

			if (typeof sessionTabId === 'number') {
				failurePhase = DevtoolsErrorPhase.Ocr;
				const ocrStartedAt = Date.now();
				const ocrResult = await this.clipperOcr.recognize(captured.imageDataUrl, payload.ocrLanguage, (progress) => {
					this.hexaClient.sendToTab(sessionTabId as number, contentScriptApi.OcrProgress, new OcrProgressMessage(progress.progress, progress.stage)).catch(() => {});
				});
				const ocrDurationMs = Date.now() - ocrStartedAt;
				const totalDurationMs = Date.now() - operationStartedAt;
				await this.saveDiagnosticClip(new DevtoolsClipDiagnosticItem(payload.capturedAt, this.toTextPreview(ocrResult.text), ocrResult.text, ocrResult.confidence, serializeOcrLanguageSelection(payload.ocrLanguage), sessionTabId, this.toOptionalString(senderTab?.title), this.toOptionalString(senderTab?.url), captured.imageWidth, captured.imageHeight, captureDurationMs, ocrDurationMs, totalDurationMs));
				await this.hexaClient.sendToTab(sessionTabId, contentScriptApi.OcrComplete, new OcrCompleteMessage('success', ocrResult.text, ocrResult.confidence));
				console.log('[smart-clipper] OCR completed:', { tabId: sessionTabId, language: payload.ocrLanguage, confidence: ocrResult.confidence, textLength: ocrResult.text.length });
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown OCR error';
			console.error('[smart-clipper] Failed to capture/OCR active tab image:', error);
			await this.saveDevtoolsError(new DevtoolsErrorItem(Date.now(), failurePhase, message, serializeOcrLanguageSelection(payload.ocrLanguage), typeof sessionTabId === 'number' ? sessionTabId : undefined, this.toOptionalString(senderTab?.title), this.toOptionalString(senderTab?.url), captureDurationMs, Date.now() - operationStartedAt));
			if (typeof sessionTabId === 'number') {
				await this.hexaClient.sendToTab(sessionTabId, contentScriptApi.OcrComplete, new OcrCompleteMessage('error', undefined, undefined, message)).catch(() => {});
			}
		} finally {
			if (typeof sessionTabId === 'number') {
				this.clipperSession.clearSession(sessionTabId);
			}
		}
		return new StartClippingAckMessage('received');
	}

	@Action(BackgroundActionsApi.GetDevtoolsState)
	async onGetDevtoolsState(_payload: DevtoolsGetStateMessage): Promise<DevtoolsStateMessage> {
		const [clips, errors] = await Promise.all([this.getDiagnosticClips(), this.getDevtoolsErrors()]);
		return new DevtoolsStateMessage(clips, errors);
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
		const clips = await this.getDiagnosticClips();
		return clips.slice(0, MAX_POPUP_RECENT_CLIPS).map((entry) => new RecentClipItem(entry.capturedAt, entry.textPreview, entry.confidence, entry.ocrLanguage));
	}

	private async getDiagnosticClips(): Promise<DevtoolsClipDiagnosticItem[]> {
		try {
			const stored = await this.storagePort.get('local', RECENT_CLIPS_STORAGE_KEY);
			const rawClips = Array.isArray(stored[RECENT_CLIPS_STORAGE_KEY]) ? stored[RECENT_CLIPS_STORAGE_KEY] : [];
			return rawClips
				.map(entry => this.toDiagnosticClip(entry))
				.filter((entry): entry is DevtoolsClipDiagnosticItem => !!entry)
				.sort((left, right) => right.capturedAt - left.capturedAt)
				.slice(0, MAX_DEVTOOLS_CLIPS);
		} catch (error) {
			console.warn('[smart-clipper] Failed to read recent clips from storage.', error);
			return [];
		}
	}

	private async getDevtoolsErrors(): Promise<DevtoolsErrorItem[]> {
		try {
			const stored = await this.storagePort.get('local', DEVTOOLS_ERRORS_STORAGE_KEY);
			const rawErrors = Array.isArray(stored[DEVTOOLS_ERRORS_STORAGE_KEY]) ? stored[DEVTOOLS_ERRORS_STORAGE_KEY] : [];
			return rawErrors
				.map(entry => this.toDevtoolsError(entry))
				.filter((entry): entry is DevtoolsErrorItem => !!entry)
				.sort((left, right) => right.failedAt - left.failedAt)
				.slice(0, MAX_DEVTOOLS_ERRORS);
		} catch (error) {
			console.warn('[smart-clipper] Failed to read devtools errors from storage.', error);
			return [];
		}
	}

	private async saveDiagnosticClip(clip: DevtoolsClipDiagnosticItem): Promise<void> {
		try {
			const existing = await this.getDiagnosticClips();
			const deduplicated = existing.filter(entry => !(entry.capturedAt === clip.capturedAt && entry.textPreview === clip.textPreview));
			const nextClips = [clip, ...deduplicated].sort((left, right) => right.capturedAt - left.capturedAt).slice(0, MAX_DEVTOOLS_CLIPS);
			await this.storagePort.set('local', { [RECENT_CLIPS_STORAGE_KEY]: nextClips });
			this.emitDevtoolsClipSync(nextClips);
		} catch (error) {
			console.warn('[smart-clipper] Failed to save diagnostics clip.', error);
		}
	}

	private async saveDevtoolsError(errorItem: DevtoolsErrorItem): Promise<void> {
		try {
			const existing = await this.getDevtoolsErrors();
			const nextErrors = [errorItem, ...existing].sort((left, right) => right.failedAt - left.failedAt).slice(0, MAX_DEVTOOLS_ERRORS);
			await this.storagePort.set('local', { [DEVTOOLS_ERRORS_STORAGE_KEY]: nextErrors });
			this.emitDevtoolsErrorSync(nextErrors);
		} catch (error) {
			console.warn('[smart-clipper] Failed to save devtools error.', error);
		}
	}

	private emitDevtoolsClipSync(clips: DevtoolsClipDiagnosticItem[]): void {
		this.runtimePort.sendMessage({ action: devtoolsHandlesApi.SyncClips, payload: new DevtoolsSyncClipsMessage(clips) }).catch((error) => {
			console.warn('[smart-clipper] Failed to sync devtools clips.', error);
		});
	}

	private emitDevtoolsErrorSync(errors: DevtoolsErrorItem[]): void {
		this.runtimePort.sendMessage({ action: devtoolsHandlesApi.SyncErrors, payload: new DevtoolsSyncErrorsMessage(errors) }).catch((error) => {
			console.warn('[smart-clipper] Failed to sync devtools errors.', error);
		});
	}

	private toDiagnosticClip(value: unknown): DevtoolsClipDiagnosticItem | undefined {
		if (!value || typeof value !== 'object') {
			return undefined;
		}

		const entry = value as Record<string, unknown>;
		if (typeof entry.capturedAt !== 'number' || typeof entry.textPreview !== 'string') {
			return undefined;
		}

		const fullText = typeof entry.fullText === 'string' ? entry.fullText : entry.textPreview;
		return new DevtoolsClipDiagnosticItem(entry.capturedAt, entry.textPreview, fullText, this.toOptionalNumber(entry.confidence), this.toOptionalString(entry.ocrLanguage), this.toOptionalNumber(entry.sourceTabId), this.toOptionalString(entry.sourceTabTitle), this.toOptionalString(entry.sourceTabUrl), this.toOptionalNumber(entry.imageWidth), this.toOptionalNumber(entry.imageHeight), this.toOptionalNumber(entry.captureDurationMs), this.toOptionalNumber(entry.ocrDurationMs), this.toOptionalNumber(entry.totalDurationMs));
	}

	private toDevtoolsError(value: unknown): DevtoolsErrorItem | undefined {
		if (!value || typeof value !== 'object') {
			return undefined;
		}

		const entry = value as Record<string, unknown>;
		if (typeof entry.failedAt !== 'number' || typeof entry.message !== 'string') {
			return undefined;
		}

		return new DevtoolsErrorItem(entry.failedAt, this.toDevtoolsErrorPhase(entry.phase), entry.message, this.toOptionalString(entry.ocrLanguage), this.toOptionalNumber(entry.sourceTabId), this.toOptionalString(entry.sourceTabTitle), this.toOptionalString(entry.sourceTabUrl), this.toOptionalNumber(entry.captureDurationMs), this.toOptionalNumber(entry.totalDurationMs));
	}

	private toDevtoolsErrorPhase(value: unknown): DevtoolsErrorPhase {
		switch (value) {
			case DevtoolsErrorPhase.Capture:
			case DevtoolsErrorPhase.Ocr:
			case DevtoolsErrorPhase.Unknown:
				return value;
			default:
				return DevtoolsErrorPhase.Unknown;
		}
	}

	private toOptionalString(value: unknown): string | undefined {
		return typeof value === 'string' ? value : undefined;
	}

	private toOptionalNumber(value: unknown): number | undefined {
		return typeof value === 'number' ? value : undefined;
	}

	private async getTabSafely(tabId: number, fallback?: HexaWebTab): Promise<HexaWebTab | undefined> {
		try {
			const tab = await this.tabsPort.getTab(tabId);
			return tab ?? fallback;
		} catch {
			return fallback;
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

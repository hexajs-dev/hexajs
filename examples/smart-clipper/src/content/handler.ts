import { Handle, Handler, HexaContentClient } from '@hexajs-dev/core';
import { ClipboardPort } from '@hexajs-dev/ports';
import { SmartClipperContent } from './content';
import { backgroundApi, ContentScriptHandlesApi, contentScriptNamespace } from '@contract/api';
import { ClippingCancelledMessage, ClippingCompleteMessage, OcrCompleteMessage, OcrProgressMessage, PopupStartClippingMessage, StartClippingAckMessage } from '@contract/messages/messages';
import { ClipperUiService } from './ui/clipper-ui.service';


/**
 * Content handler for the "smart-clipper" namespace.
 * Add @Handle methods here to handle messages sent from the background script.
 */
@Handler({ namespace: contentScriptNamespace, Contents: [SmartClipperContent] })
export class SmartClipperHandler {
	constructor(private readonly clipperUi: ClipperUiService, private readonly client: HexaContentClient, private readonly clipboardPort: ClipboardPort) {}

	@Handle(ContentScriptHandlesApi.StartClipping)
	onStartClipping(payload: PopupStartClippingMessage): StartClippingAckMessage {
		return this.clipperUi.startClipping(payload, {
			onComplete: (message: ClippingCompleteMessage) => {
				this.client.sendMessage<ClippingCompleteMessage, StartClippingAckMessage>(backgroundApi.ClippingComplete, message)
					.catch(error => console.error('[smart-clipper] Failed to report clipping completion', error));
			},
			onCancelled: (message: ClippingCancelledMessage) => {
				this.client.sendMessage<ClippingCancelledMessage, StartClippingAckMessage>(backgroundApi.ClippingCancelled, message)
					.catch(error => console.error('[smart-clipper] Failed to report clipping cancellation', error));
			}
		});
	}

	@Handle(ContentScriptHandlesApi.OcrProgress)
	onOcrProgress(payload: OcrProgressMessage): StartClippingAckMessage {
		this.clipperUi.updateOcrProgress(payload.progress, payload.stage);
		return new StartClippingAckMessage('received');
	}

	@Handle(ContentScriptHandlesApi.OcrComplete)
	async onOcrComplete(payload: OcrCompleteMessage): Promise<StartClippingAckMessage> {
		if (payload.status === 'success' && payload.text) {
			try {
				await this.clipboardPort.writeText(payload.text);
				this.clipperUi.showOcrSuccess(payload.text);
			} catch {
				// Safari (and some other contexts) block clipboard writes from message handlers
				// because there is no user gesture. Show a "tap to copy" prompt instead.
				this.clipperUi.showOcrCopyPrompt(payload.text, () => {
					navigator.clipboard?.writeText(payload.text!)
						.then(() => this.clipperUi.showOcrSuccess(payload.text!))
						.catch(e => {
							console.error('[smart-clipper] Tap-to-copy failed:', e);
							this.clipperUi.showOcrError('Clipboard access denied');
						});
				});
			}
		} else {
			console.error('[smart-clipper] OCR failed:', payload.error);
			this.clipperUi.showOcrError(payload.error ?? 'OCR failed');
		}
		return new StartClippingAckMessage('received');
	}
}

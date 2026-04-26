import { Injectable, InjectableContext } from '@hexajs-dev/common';
import { ClipperRect } from '@contract/messages/messages';

export interface CropActiveTabImageInput {
	imageDataUrl: string;
	rect: ClipperRect;
	viewportWidth?: number;
	viewportHeight?: number;
}

export interface CropActiveTabImageResult {
	imageDataUrl: string;
	imageWidth: number;
	imageHeight: number;
}

@Injectable({ context: InjectableContext.Background })
export class ClipperImageCropService {
	async cropActiveTabImage(input: CropActiveTabImageInput): Promise<CropActiveTabImageResult> {
		if (input.rect.width <= 0 || input.rect.height <= 0) {
			throw new Error('Cannot crop image from an empty selection rectangle.');
		}
		if (typeof createImageBitmap !== 'function') {
			throw new Error('createImageBitmap API is not available in the current background context.');
		}
		if (typeof OffscreenCanvas === 'undefined') {
			throw new Error('OffscreenCanvas API is not available in the current background context.');
		}

		const sourceBlob = await this.dataUrlToBlob(input.imageDataUrl);
		const sourceBitmap = await createImageBitmap(sourceBlob);
		const scaleX = input.viewportWidth && input.viewportWidth > 0 ? sourceBitmap.width / input.viewportWidth : 1;
		const scaleY = input.viewportHeight && input.viewportHeight > 0 ? sourceBitmap.height / input.viewportHeight : 1;
		const left = Math.max(0, Math.min(sourceBitmap.width, Math.floor(input.rect.x * scaleX)));
		const top = Math.max(0, Math.min(sourceBitmap.height, Math.floor(input.rect.y * scaleY)));
		const right = Math.max(left, Math.min(sourceBitmap.width, Math.ceil((input.rect.x + input.rect.width) * scaleX)));
		const bottom = Math.max(top, Math.min(sourceBitmap.height, Math.ceil((input.rect.y + input.rect.height) * scaleY)));
		const x = left;
		const y = top;
		const width = right - left;
		const height = bottom - top;

		if (width <= 0 || height <= 0) {
			sourceBitmap.close();
			throw new Error('Selection rectangle is outside the captured image bounds.');
		}

		const canvas = new OffscreenCanvas(width, height);
		const context = canvas.getContext('2d');
		if (!context) {
			sourceBitmap.close();
			throw new Error('2D context is unavailable for image cropping.');
		}

		context.drawImage(sourceBitmap, x, y, width, height, 0, 0, width, height);
		sourceBitmap.close();
		const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
		const croppedDataUrl = await this.blobToDataUrl(croppedBlob);
		return {
			imageDataUrl: croppedDataUrl,
			imageWidth: width,
			imageHeight: height,
		};
	}

	private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
		const response = await fetch(dataUrl);
		if (!response.ok) {
			throw new Error('Failed to decode captured image data URL.');
		}
		return response.blob();
	}

	private async blobToDataUrl(blob: Blob): Promise<string> {
		const buffer = await blob.arrayBuffer();
		const bytes = new Uint8Array(buffer);
		let binary = '';
		for (let index = 0; index < bytes.length; index++) {
			binary += String.fromCharCode(bytes[index]);
		}
		return `data:${blob.type};base64,${btoa(binary)}`;
	}
}

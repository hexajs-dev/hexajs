import { Injectable, HexaContext, InjectWorker } from '@hexajs-dev/common';
import { withWorkerEvents, WorkerCallEvent } from '@hexajs-dev/core';
import { OcrWorker } from '../workers/ocr.worker';
import { ClipperOcrModelService } from './clipper-ocr-model.service';

export interface OcrProgress {
	progress: number;
	stage: string;
}

export interface OcrResult {
	text: string;
	confidence: number;
}

@Injectable({ context: HexaContext.Background })
export class ClipperOcrService {
	@InjectWorker() private ocrWorker!: OcrWorker;

	constructor(private readonly modelService: ClipperOcrModelService) {}

	async recognize(imageDataUrl: string, language?: string, onProgress?: (progress: OcrProgress) => void): Promise<OcrResult> {
		const model = await this.modelService.resolve(language);
		const worker = withWorkerEvents(this.ocrWorker, (event: WorkerCallEvent) => {
			if (event.eventType !== 'ocr-progress' || !onProgress || !event.data || typeof event.data !== 'object') {
				return;
			}

			const payload = event.data as { progress?: unknown; stage?: unknown };
			if (typeof payload.progress !== 'number') {
				return;
			}

			onProgress({
				progress: payload.progress,
				stage: typeof payload.stage === 'string' ? payload.stage : 'processing',
			});
		});

		const result = await worker.recognize(imageDataUrl, model.language, model.workerPath, model.corePath, model.langPath, model.cachePath);
		await this.modelService.markLanguageReady(model.language, model.source);
		return result;
	}
}

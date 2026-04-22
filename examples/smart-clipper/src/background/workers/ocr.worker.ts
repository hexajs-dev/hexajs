import { Worker, WorkerEnvironment, emitWorkerEvent } from '@hexajs/core';
import { createWorker, LoggerMessage } from '@libs/tesseract';
import { DEFAULT_OCR_LANGUAGE, serializeOcrLanguageSelection } from '@contract/ocr-language';

export interface WorkerOcrResult {
	text: string;
	confidence: number;
}

@Worker({ name: 'ocr-worker', environment: WorkerEnvironment.DOM })
export class OcrWorker {
	async recognize(imageDataUrl: string, language: string, workerPath: string, corePath: string, langPath: string | undefined, cachePath: string): Promise<WorkerOcrResult> {
		const worker = await createWorker(serializeOcrLanguageSelection(language ?? DEFAULT_OCR_LANGUAGE), undefined, {
			workerPath,
			corePath,
			langPath,
			cachePath,
			cacheMethod: 'write',
			workerBlobURL: false,
			gzip: true,
			logger: (message: LoggerMessage) => {
				if (typeof message.progress === 'number') {
					emitWorkerEvent('ocr-progress', {
						progress: Math.round(message.progress * 100),
						stage: message.status ?? 'processing',
					});
				}
			},
		});

		try {
			const { data } = await worker.recognize(imageDataUrl);
			return { text: data.text, confidence: data.confidence };
		} finally {
			await worker.terminate();
		}
	}
}
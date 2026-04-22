import { Injectable, InjectableContext } from '@hexajs/common';
import { RuntimePort, StoragePort } from '@hexajs/ports';
import { DEFAULT_OCR_LANGUAGE, areAllSelectedLanguagesBundled, OCR_MODEL_CACHE_PATH, parseOcrLanguageSelection, serializeOcrLanguageSelection } from '@contract/ocr-language';

const OCR_MODEL_STATE_KEY = 'smart-clipper.ocr-model-state';

interface OcrModelState {
	readyLanguages: Record<string, { lastReadyAt: number; source: 'bundled' | 'remote' }>;
}

export interface ResolvedOcrModel {
	language: string;
	workerPath: string;
	corePath: string;
	langPath?: string;
	cachePath: string;
	source: 'bundled' | 'remote';
}

@Injectable({ context: InjectableContext.Background })
export class ClipperOcrModelService {
	constructor(private readonly runtimePort: RuntimePort, private readonly storagePort: StoragePort) {}

	async resolve(language?: string): Promise<ResolvedOcrModel> {
		const normalizedLanguages = parseOcrLanguageSelection(language);
		const selection = serializeOcrLanguageSelection(normalizedLanguages);
		const bundled = areAllSelectedLanguagesBundled(normalizedLanguages);
		return {
			language: selection,
			workerPath: this.runtimePort.getURL('libs/tesseract/worker.min.js'),
			corePath: this.runtimePort.getURL('libs/tesseract'),
			langPath: bundled ? this.runtimePort.getURL('libs/tesseract/lang-data') : undefined,
			cachePath: OCR_MODEL_CACHE_PATH,
			source: bundled ? 'bundled' : 'remote',
		};
	}

	async markLanguageReady(language?: string, source: 'bundled' | 'remote' = 'remote'): Promise<void> {
		const state = await this.getState();
		for (const normalizedLanguage of parseOcrLanguageSelection(language ?? DEFAULT_OCR_LANGUAGE)) {
			state.readyLanguages[normalizedLanguage] = {
				lastReadyAt: Date.now(),
				source,
			};
		}
		await this.storagePort.set('local', { [OCR_MODEL_STATE_KEY]: state });
	}

	private async getState(): Promise<OcrModelState> {
		const result = await this.storagePort.get('local', [OCR_MODEL_STATE_KEY]);
		const state = result[OCR_MODEL_STATE_KEY] as OcrModelState | undefined;
		if (!state || typeof state !== 'object' || !state.readyLanguages || typeof state.readyLanguages !== 'object') {
			return { readyLanguages: {} };
		}
		return state;
	}
}
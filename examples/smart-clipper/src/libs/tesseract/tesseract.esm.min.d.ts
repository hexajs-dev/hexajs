export interface LoggerMessage {
	progress?: number;
	status?: string;
	userJobId?: string;
	[key: string]: unknown;
}

export interface CreateWorkerOptions {
	workerPath?: string;
	corePath?: string;
	langPath?: string;
	dataPath?: string;
	cachePath?: string;
	cacheMethod?: string;
	gzip?: boolean;
	workerBlobURL?: boolean;
	logger?: (message: LoggerMessage) => void;
	errorHandler?: (error: string) => void;
	[key: string]: unknown;
}

export interface TesseractRecognizeResultData {
	text: string;
	confidence: number;
	[key: string]: unknown;
}

export interface TesseractWorker {
	recognize(image: unknown, opts?: unknown, output?: unknown, jobId?: string): Promise<{ jobId: string; data: TesseractRecognizeResultData }>;
	terminate(): Promise<void>;
}

export interface TesseractBundle {
	createWorker(langs?: string | string[], oem?: number, options?: CreateWorkerOptions, config?: Record<string, unknown>): Promise<TesseractWorker>;
}

declare const Tesseract: TesseractBundle;

export default Tesseract;

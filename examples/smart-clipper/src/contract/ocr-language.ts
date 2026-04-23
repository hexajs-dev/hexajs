export enum OcrLanguageCode {
	English = 'eng',
	Hebrew = 'heb',
	Spanish = 'spa',
	French = 'fra',
	German = 'deu',
	Portuguese = 'por',
	Italian = 'ita',
	Russian = 'rus',
}

export interface OcrLanguageDefinition {
	code: OcrLanguageCode;
	label: string;
	tag: string;
	bundled: boolean;
}

export const DEFAULT_OCR_LANGUAGE = OcrLanguageCode.English;
export const OCR_LANGUAGE_SELECTION_STORAGE_KEY = 'smart-clipper.popup.ocr-languages';
export const OCR_MODEL_CACHE_PATH = 'smart-clipper-ocr-cache';

export const SUPPORTED_OCR_LANGUAGES: ReadonlyArray<OcrLanguageDefinition> = [
	{ code: OcrLanguageCode.English, label: 'English', tag: 'GB', bundled: true },
	{ code: OcrLanguageCode.Hebrew, label: 'Hebrew', tag: 'HE', bundled: false },
	{ code: OcrLanguageCode.Spanish, label: 'Spanish', tag: 'ES', bundled: false },
	{ code: OcrLanguageCode.French, label: 'French', tag: 'FR', bundled: false },
	{ code: OcrLanguageCode.German, label: 'German', tag: 'DE', bundled: false },
	{ code: OcrLanguageCode.Portuguese, label: 'Portuguese', tag: 'PT', bundled: false },
	{ code: OcrLanguageCode.Italian, label: 'Italian', tag: 'IT', bundled: false },
	{ code: OcrLanguageCode.Russian, label: 'Russian', tag: 'RU', bundled: false },
];

export function normalizeOcrLanguage(language?: string): OcrLanguageCode {
	if (!language) {
		return DEFAULT_OCR_LANGUAGE;
	}
	const match = SUPPORTED_OCR_LANGUAGES.find(entry => entry.code === language);
	return match?.code ?? DEFAULT_OCR_LANGUAGE;
}

export function isBundledOcrLanguage(language?: string): boolean {
	const normalizedLanguage = normalizeOcrLanguage(language);
	return SUPPORTED_OCR_LANGUAGES.some(entry => entry.code === normalizedLanguage && entry.bundled);
}

export function parseOcrLanguageSelection(languages?: string | string[]): OcrLanguageCode[] {
	let rawLanguages: string[] = [];
	if (Array.isArray(languages)) {
		rawLanguages = languages;
	} else if (typeof languages === 'string') {
		const trimmedLanguages = languages.trim();
		if (trimmedLanguages.startsWith('[')) {
			try {
				const parsed = JSON.parse(trimmedLanguages);
				rawLanguages = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
			} catch {
				rawLanguages = trimmedLanguages.split('+');
			}
		} else {
			rawLanguages = trimmedLanguages.split('+');
		}
	}
	const normalizedLanguages = new Set<OcrLanguageCode>();
	for (const language of rawLanguages) {
		const match = SUPPORTED_OCR_LANGUAGES.find(entry => entry.code === language);
		if (match) {
			normalizedLanguages.add(match.code);
		}
	}
	if (normalizedLanguages.size === 0) {
		return [DEFAULT_OCR_LANGUAGE];
	}
	return SUPPORTED_OCR_LANGUAGES.filter(entry => normalizedLanguages.has(entry.code)).map(entry => entry.code);
}

export function serializeOcrLanguageSelection(languages?: string | string[]): string {
	return parseOcrLanguageSelection(languages).join('+');
}

export function areAllSelectedLanguagesBundled(languages?: string | string[]): boolean {
	return parseOcrLanguageSelection(languages).every(language => isBundledOcrLanguage(language));
}

export function getOcrLanguageSummary(languages?: string | string[]): string {
	const selection = parseOcrLanguageSelection(languages);
	if (selection.length === 1) {
		return getOcrLanguageLabel(selection[0]);
	}
	return `${selection.length} languages selected`;
}

export function getOcrLanguageDefinition(language?: string): OcrLanguageDefinition {
	const normalizedLanguage = normalizeOcrLanguage(language);
	return SUPPORTED_OCR_LANGUAGES.find(entry => entry.code === normalizedLanguage) ?? SUPPORTED_OCR_LANGUAGES[0];
}

export function getOcrLanguageLabel(language?: string): string {
	const normalizedLanguage = normalizeOcrLanguage(language);
	return SUPPORTED_OCR_LANGUAGES.find(entry => entry.code === normalizedLanguage)?.label ?? 'English';
}

export function getOcrLanguageTag(language?: string): string {
	return getOcrLanguageDefinition(language).tag;
}
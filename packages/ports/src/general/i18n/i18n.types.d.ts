declare global {
    interface HexaWebI18nLanguageDetectionResult {
        language: string;
        percentage: number;
    }

    interface HexaWebI18nDetectLanguageResult {
        isReliable: boolean;
        languages: HexaWebI18nLanguageDetectionResult[];
    }

    namespace webExt {
        namespace i18n {
            function getAcceptLanguages(callback: (languages: string[]) => void): void;
            function getAcceptLanguages(): Promise<string[]>;
            function detectLanguage(text: string, callback: (result: HexaWebI18nDetectLanguageResult) => void): void;
            function detectLanguage(text: string): Promise<HexaWebI18nDetectLanguageResult>;
        }
    }
}

export {};

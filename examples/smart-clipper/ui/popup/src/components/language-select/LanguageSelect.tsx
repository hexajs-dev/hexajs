import { useEffect, useRef } from 'react';
import { OcrLanguageCode, SUPPORTED_OCR_LANGUAGES } from '@contract/ocr-language';
import { ChevronIcon, TranslateIcon } from '../shared/icons/Icons';
import { LANGUAGE_META_TEXT, LANGUAGE_NOTE_TEXT } from './constants';
import { LanguageOption } from './language/LanguageOption';
import './LanguageSelect.scss';

type LanguageSelectProps = {
  isLanguageMenuOpen: boolean;
  ocrLanguages: OcrLanguageCode[];
  onCloseLanguageMenu: () => void;
  onToggleLanguage: (languageCode: string) => void;
  onToggleLanguageMenu: () => void;
  selectedLanguageSummary: string;
  selectedLanguagesBundled: boolean;
};

export function LanguageSelect({ isLanguageMenuOpen, ocrLanguages, onCloseLanguageMenu, onToggleLanguage, onToggleLanguageMenu, selectedLanguageSummary, selectedLanguagesBundled }: LanguageSelectProps) {
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        onCloseLanguageMenu();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [onCloseLanguageMenu]);

  const onLanguageOptionClick = (languageCode: string) => {
    onToggleLanguage(languageCode);
  };

  return (
    <section className='language-section' ref={languageMenuRef}>
      <button type='button' className={`language-trigger ${isLanguageMenuOpen ? 'open' : ''}`} onClick={onToggleLanguageMenu}>
        <div className='language-trigger-main'>
          <span className='language-icon'><TranslateIcon /></span>
          <span className='language-summary'>{selectedLanguageSummary}</span>
        </div>
        <div className='language-trigger-side'>
          <span className='language-count'>{ocrLanguages.length}</span>
          <span className={`language-chevron ${isLanguageMenuOpen ? 'open' : ''}`}><ChevronIcon /></span>
        </div>
      </button>

      {isLanguageMenuOpen ? (
        <div className='language-panel'>
          {SUPPORTED_OCR_LANGUAGES.map(language => {
            const selected = ocrLanguages.includes(language.code);
            return (
              <LanguageOption
                key={language.code}
                code={language.code}
                isSelected={selected}
                label={language.label}
                metaLabel={language.bundled ? LANGUAGE_META_TEXT.bundled : LANGUAGE_META_TEXT.downloadOnFirstUse}
                tag={language.tag}
                onSelect={onLanguageOptionClick}
              />
            );
          })}
        </div>
      ) : null}

      <p className='language-note'>
        {selectedLanguagesBundled ? `${selectedLanguageSummary} ${LANGUAGE_NOTE_TEXT.ready}` : `${selectedLanguageSummary} ${LANGUAGE_NOTE_TEXT.missingModels}`}
      </p>
    </section>
  );
}

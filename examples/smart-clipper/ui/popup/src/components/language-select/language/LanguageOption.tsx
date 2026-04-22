import { OcrLanguageCode } from '@contract/ocr-language';
import { CheckIcon } from '../../shared/icons/Icons';
import './LanguageOption.scss';

type LanguageOptionProps = {
  code: OcrLanguageCode;
  isSelected: boolean;
  label: string;
  metaLabel: string;
  onSelect: (languageCode: string) => void;
  tag: string;
};

export function LanguageOption({ code, isSelected, label, metaLabel, onSelect, tag }: LanguageOptionProps) {
  return (
    <button type='button' className={`language-option ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(code)}>
      <span className={`language-check ${isSelected ? 'selected' : ''}`}>{isSelected ? <CheckIcon /> : null}</span>
      <span className='language-tag'>{tag}</span>
      <span className='language-label'>{label}</span>
      <span className='language-meta'>{metaLabel}</span>
    </button>
  );
}

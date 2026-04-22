import { useState } from 'react';
import { RecentClipItem } from '@contract/messages/messages';
import { CopyIcon } from '../../shared/icons/Icons';
import { copyToClipboard, formatTimeAgo, getClipLanguageTags } from '../../shared/methods';
import './RecentCard.scss';

type RecentCardProps = {
  clip: RecentClipItem;
  emptyOcrText: string;
};

export function RecentCard({ clip, emptyOcrText }: RecentCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const tags = getClipLanguageTags(clip.ocrLanguage);
  const copyText = clip.textPreview || '';

  const onCopy = async () => {
    if (!copyText) {
      return;
    }
    const copied = await copyToClipboard(copyText);
    if (!copied) {
      return;
    }
    setIsCopied(true);
    window.setTimeout(() => {
      setIsCopied(false);
    }, 1200);
  };

  return (
    <div className='recent-card'>
      <div className='recent-top'>
        <p className='recent-title'>{formatTimeAgo(clip.capturedAt)}</p>
        <div className='recent-actions'>
          <span className='recent-confidence'>{typeof clip.confidence === 'number' ? `${Math.round(clip.confidence)}%` : '--'}</span>
          <button type='button' className='recent-copy-btn' onClick={onCopy} disabled={!copyText} aria-label='Copy clip text'>
            <CopyIcon />
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <p className='recent-copy'>{clip.textPreview || emptyOcrText}</p>
      <div className='recent-tags'>
        {tags.map(tag => <span key={tag} className='recent-tag'>{tag}</span>)}
      </div>
    </div>
  );
}

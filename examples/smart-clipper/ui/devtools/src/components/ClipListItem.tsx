import { DevtoolsClipDiagnosticItem } from '@contract/messages/messages';
import { formatConfidence, formatRelativeTime, getClipKey } from '../utils/format';

type ClipListItemProps = { clip: DevtoolsClipDiagnosticItem; isActive: boolean; onSelect: (key: string) => void };

export function ClipListItem({ clip, isActive, onSelect }: ClipListItemProps) {
  const clipKey = getClipKey(clip);

  return (
    <button className={`dt-list-item${isActive ? ' is-active' : ''}`} type='button' onClick={() => onSelect(clipKey)}>
      <div className='dt-list-item-head'>
        <span className='dt-time'>{formatRelativeTime(clip.capturedAt)}</span>
        <span className='dt-badge'>{formatConfidence(clip.confidence)}</span>
      </div>
      <p>{clip.textPreview}</p>
      <div className='dt-list-item-meta'>
        <span>{clip.sourceTabTitle || 'Untitled tab'}</span>
        <span>{clip.ocrLanguage || 'n/a'}</span>
      </div>
    </button>
  );
}

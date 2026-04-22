import { ClipItem } from '../../../../../src/contract/messages';
import { formatRelativeTime, truncateText } from '../../../../shared/utils/text';

type ClipListItemProps = { clip: ClipItem; isActive: boolean; usage: number; onSelect: (clipId: string) => void };

export function ClipListItem({ clip, isActive, usage, onSelect }: ClipListItemProps) {
  return (
    <button className={`dt-list-item${isActive ? ' is-active' : ''}`} onClick={() => onSelect(clip.id)}>
      <div className="dt-list-item-head">
        <span className="dt-domain">{clip.sourceDomain}</span>
        <span className="dt-time">{formatRelativeTime(clip.capturedAt)}</span>
      </div>
      <p>{truncateText(clip.text, 80)}</p>
      <div className="dt-list-item-meta">
        <span>{clip.sourceElement}</span>
        <span>{usage}x</span>
      </div>
    </button>
  );
}

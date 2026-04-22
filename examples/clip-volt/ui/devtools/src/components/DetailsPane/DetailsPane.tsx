import { Clock3, Copy, Hash, Tag, Trash2 } from 'lucide-react';
import { ClipItem } from '../../../../../src/contract/messages';
import { formatRelativeTime } from '../../../../shared/utils/text';

type DetailsPaneProps = { selectedClip: ClipItem | null; selectedUsageCount: number; onCopy: () => void; onRemove: () => void };

export function DetailsPane({ selectedClip, selectedUsageCount, onCopy, onRemove }: DetailsPaneProps) {
  if (!selectedClip) {
    return (
      <section className="dt-details">
        <div className="dt-empty-view">
          <div className="dt-empty-view-icon"><Tag size={34} /></div>
          <h2>Select a clip to inspect</h2>
          <p>View metadata and usage details</p>
        </div>
      </section>
    );
  }

  return (
    <section className="dt-details">
      <div className="dt-block">
        <h3>Content</h3>
        <pre><code>{selectedClip.text}</code></pre>
      </div>

      <div className="dt-block">
        <h3>Details</h3>
        <div className="dt-meta-grid">
          <div className="dt-meta-card"><span>Domain</span><strong>{selectedClip.sourceDomain}</strong></div>
          <div className="dt-meta-card"><span>Element</span><strong>{selectedClip.sourceElement}</strong></div>
          <div className="dt-meta-card"><span>Copied</span><strong><Clock3 size={13} /> {formatRelativeTime(selectedClip.capturedAt)}</strong></div>
          <div className="dt-meta-card"><span>Times used</span><strong><Hash size={13} /> {selectedUsageCount} times</strong></div>
        </div>
      </div>

      <div className="dt-block">
        <h3>Source</h3>
        <a href={selectedClip.sourceUrl} target="_blank" rel="noreferrer">{selectedClip.sourceUrl}</a>
      </div>

      <div className="dt-actions">
        <button className="dt-button-primary" onClick={onCopy}><Copy size={16} /> Copy to clipboard</button>
        <button className="dt-button-danger" onClick={onRemove}><Trash2 size={16} /> Delete</button>
      </div>
    </section>
  );
}

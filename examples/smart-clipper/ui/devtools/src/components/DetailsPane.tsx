import { DevtoolsClipDiagnosticItem, DevtoolsErrorItem } from '@contract/messages/messages';
import { formatConfidence, formatDuration, formatRelativeTime, getErrorKey } from '../utils/format';

type DetailsPaneProps = { selectedClip: DevtoolsClipDiagnosticItem | null; errors: DevtoolsErrorItem[]; onCopy: () => void };

export function DetailsPane({ selectedClip, errors, onCopy }: DetailsPaneProps) {
  return (
    <section className='dt-details'>
      {selectedClip ? (
        <>
          <article className='dt-block'>
            <h3>OCR Content</h3>
            <pre><code>{selectedClip.fullText || selectedClip.textPreview}</code></pre>
            <div className='dt-actions'>
              <button className='dt-button-primary' type='button' onClick={onCopy}>Copy OCR text</button>
            </div>
          </article>

          <article className='dt-block'>
            <h3>System Metadata</h3>
            <div className='dt-meta-grid'>
              <div className='dt-meta-card'><span>Captured</span><strong>{formatRelativeTime(selectedClip.capturedAt)}</strong></div>
              <div className='dt-meta-card'><span>Language</span><strong>{selectedClip.ocrLanguage || 'n/a'}</strong></div>
              <div className='dt-meta-card'><span>Confidence</span><strong>{formatConfidence(selectedClip.confidence)}</strong></div>
              <div className='dt-meta-card'><span>Tab ID</span><strong>{typeof selectedClip.sourceTabId === 'number' ? selectedClip.sourceTabId : 'n/a'}</strong></div>
              <div className='dt-meta-card'><span>Image Size</span><strong>{selectedClip.imageWidth && selectedClip.imageHeight ? `${selectedClip.imageWidth} x ${selectedClip.imageHeight}` : 'n/a'}</strong></div>
              <div className='dt-meta-card'><span>Source Tab</span><strong>{selectedClip.sourceTabTitle || 'Untitled tab'}</strong></div>
            </div>
            {selectedClip.sourceTabUrl ? <a href={selectedClip.sourceTabUrl} target='_blank' rel='noreferrer'>{selectedClip.sourceTabUrl}</a> : <p className='dt-subtle'>No source URL available.</p>}
          </article>

          <article className='dt-block'>
            <h3>Performance</h3>
            <div className='dt-meta-grid'>
              <div className='dt-meta-card'><span>Capture</span><strong>{formatDuration(selectedClip.captureDurationMs)}</strong></div>
              <div className='dt-meta-card'><span>OCR</span><strong>{formatDuration(selectedClip.ocrDurationMs)}</strong></div>
              <div className='dt-meta-card'><span>Total</span><strong>{formatDuration(selectedClip.totalDurationMs)}</strong></div>
            </div>
          </article>
        </>
      ) : (
        <article className='dt-empty-view'>
          <h2>Select a capture</h2>
          <p>Inspect OCR text, source metadata, and performance diagnostics.</p>
        </article>
      )}

      <article className='dt-block'>
        <h3>Error Log</h3>
        {errors.length === 0 ? <p className='dt-subtle'>No errors recorded.</p> : null}
        {errors.slice(0, 5).map((error, index) => (
          <div className='dt-error-row' key={getErrorKey(error, index)}>
            <div className='dt-error-head'>
              <strong>{error.phase}</strong>
              <span>{formatRelativeTime(error.failedAt)}</span>
            </div>
            <p>{error.message}</p>
            <div className='dt-error-meta'>
              <span>Language: {error.ocrLanguage || 'n/a'}</span>
              <span>Tab: {typeof error.sourceTabId === 'number' ? error.sourceTabId : 'n/a'}</span>
              <span>Total: {formatDuration(error.totalDurationMs)}</span>
            </div>
          </div>
        ))}
      </article>
    </section>
  );
}

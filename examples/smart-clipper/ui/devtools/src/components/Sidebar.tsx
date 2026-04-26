import { DevtoolsClipDiagnosticItem } from '@contract/messages/messages';
import { ClipSortMode } from '../types/ui';
import { getClipKey } from '../utils/format';
import { ClipListItem } from './ClipListItem';

type SidebarProps = { isLoading: boolean; clips: DevtoolsClipDiagnosticItem[]; selectedClipKey: string | null; searchQuery: string; sortMode: ClipSortMode; onSearchChange: (query: string) => void; onSortModeChange: (mode: ClipSortMode) => void; onSelectClip: (clipKey: string) => void };

export function Sidebar({ isLoading, clips, selectedClipKey, searchQuery, sortMode, onSearchChange, onSortModeChange, onSelectClip }: SidebarProps) {
  return (
    <aside className='dt-sidebar'>
      <div className='dt-search-wrap'>
        <input type='text' placeholder='Search OCR result, URL, title, language...' value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} />
      </div>

      <div className='dt-filters'>
        <button className={sortMode === ClipSortMode.Recent ? 'is-active' : ''} type='button' onClick={() => onSortModeChange(ClipSortMode.Recent)}>Recent</button>
        <button className={sortMode === ClipSortMode.Confidence ? 'is-active' : ''} type='button' onClick={() => onSortModeChange(ClipSortMode.Confidence)}>Confidence</button>
        <button className={sortMode === ClipSortMode.Performance ? 'is-active' : ''} type='button' onClick={() => onSortModeChange(ClipSortMode.Performance)}>Performance</button>
      </div>

      <div className='dt-list'>
        {isLoading ? <div className='dt-empty-list'>Loading diagnostics...</div> : null}
        {!isLoading && clips.length === 0 ? <div className='dt-empty-list'>No OCR captures yet.</div> : null}
        {!isLoading && clips.map((clip) => (
          <ClipListItem key={getClipKey(clip)} clip={clip} isActive={getClipKey(clip) === selectedClipKey} onSelect={onSelectClip} />
        ))}
      </div>
    </aside>
  );
}

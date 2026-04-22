import { Search } from 'lucide-react';
import { ClipItem } from '../../../../../src/contract/messages';
import { FilterMode } from '../../types/ui';
import { ClipListItem } from '../ClipListItem/ClipListItem';
import { normalizeClipText } from '../../../../shared/utils/text';

type SidebarProps = { isLoading: boolean; clips: ClipItem[]; selectedClipId: string | null; searchQuery: string; filterMode: FilterMode; selectedDomain: string; domains: string[]; usageCountByText: Map<string, number>; onSearchChange: (query: string) => void; onFilterModeChange: (mode: FilterMode) => void; onDomainChange: (domain: string) => void; onSelectClip: (clipId: string) => void };

export function Sidebar({ isLoading, clips, selectedClipId, searchQuery, filterMode, selectedDomain, domains, usageCountByText, onSearchChange, onFilterModeChange, onDomainChange, onSelectClip }: SidebarProps) {
  return (
    <aside className="dt-sidebar">
      <div className="dt-search-wrap">
        <Search size={14} />
        <input type="text" placeholder="Search clips..." value={searchQuery} onChange={event => onSearchChange(event.target.value)} />
      </div>

      <div className="dt-filters">
        <div className="dt-filter-tabs" role="tablist" aria-label="Sort clips">
          <button className={filterMode === 'recent' ? 'is-active' : ''} onClick={() => onFilterModeChange('recent')}>Recent</button>
          <button className={filterMode === 'most-used' ? 'is-active' : ''} onClick={() => onFilterModeChange('most-used')}>Most used</button>
        </div>

        <select value={selectedDomain} onChange={event => onDomainChange(event.target.value)} aria-label="Filter by domain">
          {domains.map(domain => <option key={domain} value={domain}>{domain === 'all' ? 'All domains' : domain}</option>)}
        </select>
      </div>

      <div className="dt-list">
        {isLoading ? <div className="dt-empty-list">Loading clips...</div> : null}
        {!isLoading && clips.length === 0 ? <div className="dt-empty-list">No clips found</div> : null}
        {!isLoading && clips.map(clip => {
          const usage = usageCountByText.get(normalizeClipText(clip.text)) ?? 1;
          return <ClipListItem key={clip.id} clip={clip} usage={usage} isActive={clip.id === selectedClipId} onSelect={onSelectClip} />;
        })}
      </div>
    </aside>
  );
}

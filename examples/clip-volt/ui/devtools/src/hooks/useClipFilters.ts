import { useMemo } from 'react';
import { ClipItem } from '../../../../src/contract/messages';
import { FilterMode } from '../types/ui';
import { normalizeClipText } from '../../../shared/utils/text';

type UseClipFiltersArgs = { clips: ClipItem[]; searchQuery: string; filterMode: FilterMode; selectedDomain: string };

export function useClipFilters({ clips, searchQuery, filterMode, selectedDomain }: UseClipFiltersArgs) {
  const usageCountByText = useMemo(() => {
    return clips.reduce((acc, clip) => {
      const key = normalizeClipText(clip.text);
      const current = acc.get(key) ?? 0;
      acc.set(key, current + 1);
      return acc;
    }, new Map<string, number>());
  }, [clips]);

  const domains = useMemo(() => {
    const uniqueDomains = new Set<string>();
    clips.forEach(clip => uniqueDomains.add(clip.sourceDomain));
    return ['all', ...Array.from(uniqueDomains).sort()];
  }, [clips]);

  const visibleClips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = clips.filter(clip => {
      if (selectedDomain !== 'all' && clip.sourceDomain !== selectedDomain) return false;
      if (!query) return true;
      return clip.text.toLowerCase().includes(query) || clip.sourceDomain.toLowerCase().includes(query) || clip.sourceElement.toLowerCase().includes(query);
    });

    if (filterMode === 'most-used') {
      filtered = [...filtered].sort((a, b) => {
        const usageA = usageCountByText.get(normalizeClipText(a.text)) ?? 1;
        const usageB = usageCountByText.get(normalizeClipText(b.text)) ?? 1;
        if (usageA !== usageB) return usageB - usageA;
        return b.capturedAt - a.capturedAt;
      });
      return filtered;
    }

    return [...filtered].sort((a, b) => b.capturedAt - a.capturedAt);
  }, [clips, filterMode, searchQuery, selectedDomain, usageCountByText]);

  return { usageCountByText, domains, visibleClips };
}

import { useMemo } from 'react';
import { DevtoolsClipDiagnosticItem } from '@contract/messages/messages';
import { ClipSortMode } from '../types/ui';

type UseClipFiltersArgs = { clips: DevtoolsClipDiagnosticItem[]; searchQuery: string; sortMode: ClipSortMode };

export function useClipFilters({ clips, searchQuery, sortMode }: UseClipFiltersArgs) {
  const visibleClips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filteredClips = clips.filter((clip) => {
      if (!query) {
        return true;
      }

      return (
        clip.textPreview.toLowerCase().includes(query)
        || clip.fullText.toLowerCase().includes(query)
        || (clip.sourceTabTitle ?? '').toLowerCase().includes(query)
        || (clip.sourceTabUrl ?? '').toLowerCase().includes(query)
        || (clip.ocrLanguage ?? '').toLowerCase().includes(query)
      );
    });

    if (sortMode === ClipSortMode.Confidence) {
      return [...filteredClips].sort((left, right) => {
        const rightConfidence = typeof right.confidence === 'number' ? right.confidence : -1;
        const leftConfidence = typeof left.confidence === 'number' ? left.confidence : -1;
        if (leftConfidence === rightConfidence) {
          return right.capturedAt - left.capturedAt;
        }
        return rightConfidence - leftConfidence;
      });
    }

    if (sortMode === ClipSortMode.Performance) {
      return [...filteredClips].sort((left, right) => {
        const rightDuration = typeof right.totalDurationMs === 'number' ? right.totalDurationMs : -1;
        const leftDuration = typeof left.totalDurationMs === 'number' ? left.totalDurationMs : -1;
        if (leftDuration === rightDuration) {
          return right.capturedAt - left.capturedAt;
        }
        return rightDuration - leftDuration;
      });
    }

    return [...filteredClips].sort((left, right) => right.capturedAt - left.capturedAt);
  }, [clips, searchQuery, sortMode]);

  return { visibleClips };
}

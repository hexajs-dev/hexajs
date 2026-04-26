import { useEffect, useMemo, useState } from 'react';
import { inject } from '@hexajs/common';
import { RuntimePort } from '@hexajs/ports';
import { devtoolsHandlesApi } from '@contract/api';
import { DevtoolsSyncThemeMessage } from '@contract/messages/messages';
import smartClipperLogoUrl from '../../../src/assets/smart-clipper.logo.svg';
import { DetailsPane } from './components/DetailsPane';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { TopBar } from './components/TopBar';
import { useClipFilters } from './hooks/useClipFilters';
import { useDevtoolsData } from './hooks/useDevtoolsData';
import { useToast } from './hooks/useToast';
import { ClipSortMode } from './types/ui';
import { formatConfidence, getClipKey } from './utils/format';

export function App() {
  const runtimePort = inject(RuntimePort);
  const { clips, errors, isLoading, loadError, reload, theme, setTheme } = useDevtoolsData();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<ClipSortMode>(ClipSortMode.Recent);
  const [selectedClipKey, setSelectedClipKey] = useState<string | null>(null);
  const { toastMessage, setToastMessage } = useToast();
  const { visibleClips } = useClipFilters({ clips, searchQuery, sortMode });

  const selectedClip = useMemo(() => {
    if (!selectedClipKey) {
      return visibleClips[0] ?? null;
    }
    return visibleClips.find((entry) => getClipKey(entry) === selectedClipKey) ?? visibleClips[0] ?? null;
  }, [selectedClipKey, visibleClips]);

  const avgConfidence = useMemo(() => {
    const values = clips.map((entry) => entry.confidence).filter((entry): entry is number => typeof entry === 'number');
    if (values.length === 0) {
      return 'n/a';
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    return formatConfidence(total / values.length);
  }, [clips]);

  useEffect(() => {
    if (!selectedClip) {
      setSelectedClipKey(null);
      return;
    }
    setSelectedClipKey(getClipKey(selectedClip));
  }, [selectedClip]);

  const onToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    runtimePort.sendMessage({ action: devtoolsHandlesApi.SyncTheme, payload: new DevtoolsSyncThemeMessage(nextTheme) }).catch((error) => {
      console.warn('[smart-clipper] Failed to sync devtools theme.', error);
    });
  };

  const onCopy = async () => {
    if (!selectedClip) {
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedClip.fullText || selectedClip.textPreview);
      setToastMessage('OCR text copied');
    } catch (error) {
      console.error('[smart-clipper] Failed to copy OCR text.', error);
      setToastMessage('Copy failed');
    }
  };

  return (
    <div className={`dt-root ${theme}`}>
      <TopBar logoUrl={smartClipperLogoUrl} clipCount={clips.length} errorCount={errors.length} avgConfidence={avgConfidence} theme={theme} onToggleTheme={onToggleTheme} onRefresh={reload} />

      <main className='dt-layout'>
        <Sidebar isLoading={isLoading} clips={visibleClips} selectedClipKey={selectedClipKey} searchQuery={searchQuery} sortMode={sortMode} onSearchChange={setSearchQuery} onSortModeChange={setSortMode} onSelectClip={setSelectedClipKey} />
        <DetailsPane selectedClip={selectedClip} errors={errors} onCopy={onCopy} />
      </main>

      {loadError ? <div className='dt-load-error'>{loadError}</div> : null}
      <Toast message={toastMessage} />
    </div>
  );
}

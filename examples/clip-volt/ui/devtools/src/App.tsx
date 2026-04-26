import { useEffect, useMemo, useState } from 'react';
import { inject } from '@hexajs-dev/common';
import { HexaUIClient } from '@hexajs-dev/ui';
import { clipboardApi, configApi } from '../../../src/contract/api';
import { ClipsResponseMessage, ConfigResponseMessage, RemoveClipMessage, UpdateConfigMessage } from '../../../src/contract/messages';
import { normalizeClipText } from '../../shared/utils/text';
import { DetailsPane } from './components/DetailsPane/DetailsPane';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Toast } from './components/Toast/Toast';
import { TopBar } from './components/TopBar/TopBar';
import { useClipFilters } from './hooks/useClipFilters';
import { useDevtoolsData } from './hooks/useDevtoolsData';
import { useToast } from './hooks/useToast';
import { FilterMode, ThemeMode } from './types/ui';

export function App() {
  const { clips, config, theme, isLoading, setClips, setConfig, setTheme } = useDevtoolsData();
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('recent');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const { toastMessage, setToastMessage } = useToast();
  const { usageCountByText, domains, visibleClips } = useClipFilters({ clips, searchQuery, filterMode, selectedDomain });

  const selectedClip = useMemo(() => {
    if (!selectedClipId) return visibleClips[0] ?? null;
    return visibleClips.find(clip => clip.id === selectedClipId) ?? visibleClips[0] ?? null;
  }, [selectedClipId, visibleClips]);

  useEffect(() => {
    if (!selectedClip) {
      setSelectedClipId(null);
      return;
    }
    setSelectedClipId(selectedClip.id);
  }, [selectedClip]);

  const handleCopy = async () => {
    if (!selectedClip) return;
    try {
      await navigator.clipboard.writeText(selectedClip.text);
      setToastMessage('Copied');
    } catch (error) {
      console.error('Clipboard write failed:', error);
      setToastMessage('Copy failed');
    }
  };

  const handleRemove = async () => {
    if (!selectedClip) return;
    const clipId = selectedClip.id;
    setClips(prev => prev.filter(item => item.id !== clipId));
    try {
      const hexaUIClient = inject(HexaUIClient);
      await hexaUIClient.sendMessage<RemoveClipMessage, ClipsResponseMessage>(clipboardApi.Remove, new RemoveClipMessage(clipId));
      setToastMessage('Deleted');
    } catch (error) {
      console.error('Failed to remove clip:', error);
      setToastMessage('Delete failed');
    }
  };

  const handleToggleTheme = async () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    setConfig(prev => ({ ...prev, theme: nextTheme }));
    try {
      const hexaUIClient = inject(HexaUIClient);
      await hexaUIClient.sendMessage<UpdateConfigMessage, ConfigResponseMessage>(configApi.Update, new UpdateConfigMessage({ theme: nextTheme }));
    } catch (error) {
      console.error('Failed to update theme:', error);
      setToastMessage('Theme update failed');
      setTheme(config.theme);
    }
  };

  const selectedUsageCount = selectedClip ? usageCountByText.get(normalizeClipText(selectedClip.text)) ?? 1 : 0;
  console.log('dev tools started 3');
  return (
    <div className={`dt-root ${theme}`}>
      <TopBar clipsCount={clips.length} uniqueCount={usageCountByText.size} domainCount={domains.length - 1} theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="dt-layout">
        <Sidebar isLoading={isLoading} clips={visibleClips} selectedClipId={selectedClip?.id ?? selectedClipId} searchQuery={searchQuery} filterMode={filterMode} selectedDomain={selectedDomain} domains={domains} usageCountByText={usageCountByText} onSearchChange={setSearchQuery} onFilterModeChange={setFilterMode} onDomainChange={setSelectedDomain} onSelectClip={setSelectedClipId} />
        <DetailsPane selectedClip={selectedClip} selectedUsageCount={selectedUsageCount} onCopy={handleCopy} onRemove={handleRemove} />
      </main>

      <Toast message={toastMessage} />
    </div>
  );
}

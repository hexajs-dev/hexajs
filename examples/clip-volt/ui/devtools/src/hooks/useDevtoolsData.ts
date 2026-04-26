import { useEffect, useState } from 'react';
import { inject } from '@hexajs-dev/common';
import { RuntimePort } from '@hexajs-dev/ports';
import { HexaUIClient } from '@hexajs-dev/ui';
import { clipboardApi, configApi } from '../../../../src/contract/api';
import { ClipVaultConfig, DEFAULT_CONFIG } from '../../../../src/contract/config';
import { ClipItem, ClipsResponseMessage, ConfigResponseMessage, GetClipsMessage, GetConfigMessage, SyncConfigMessage } from '../../../../src/contract/messages';
import { hasHexaError } from '../../../shared/utils/message';
import { ThemeMode } from '../types/ui';

export function useDevtoolsData() {
  const runtimePort = inject(RuntimePort);
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [config, setConfig] = useState<ClipVaultConfig>({ ...DEFAULT_CONFIG });
  const [theme, setTheme] = useState<ThemeMode>(DEFAULT_CONFIG.theme);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const hexaUIClient = inject(HexaUIClient);
        const [configResponse, clipsResponse] = await Promise.all([
          hexaUIClient.sendMessage<GetConfigMessage, ConfigResponseMessage>(configApi.Get, new GetConfigMessage(Date.now())),
          hexaUIClient.sendMessage<GetClipsMessage, ClipsResponseMessage>(clipboardApi.Get, new GetClipsMessage(Date.now())),
        ]);

        if (configResponse && !hasHexaError(configResponse) && configResponse.config) {
          setConfig(configResponse.config);
          setTheme(configResponse.config.theme);
        }

        if (clipsResponse && !hasHexaError(clipsResponse)) {
          setClips(clipsResponse.clips ?? []);
        }
      } catch (error) {
        console.error('Failed to load devtools data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const onMessage = (message: any) => {
      if (!message) return;
      if (message.action === 'clipboard:sync-clips') {
        const payload = message.payload as { clips?: ClipItem[] };
        setClips(payload?.clips ?? []);
        return;
      }
      if (message.action === 'clipboard:sync-config') {
        const payload = message.payload as SyncConfigMessage;
        if (!payload?.config) return;
        setConfig(payload.config);
        setTheme(payload.config.theme);
      }
    };

    const unsubscribe = runtimePort.onMessage(onMessage);
    return () => unsubscribe();
  }, [runtimePort]);

  return { clips, config, theme, isLoading, setClips, setConfig, setTheme };
}

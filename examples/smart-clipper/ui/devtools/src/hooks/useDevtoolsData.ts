import { useCallback, useEffect, useState } from 'react';
import { inject } from '@hexajs/common';
import { RuntimePort } from '@hexajs/ports';
import { HexaUIClient } from '@hexajs/ui';
import { backgroundApi, devtoolsHandlesApi } from '@contract/api';
import { DevtoolsClipDiagnosticItem, DevtoolsErrorItem, DevtoolsGetStateMessage, DevtoolsStateMessage, DevtoolsSyncClipsMessage, DevtoolsSyncErrorsMessage, DevtoolsSyncThemeMessage } from '@contract/messages/messages';
import { ThemeMode } from '../types/ui';

const POPUP_THEME_STORAGE_KEY = 'smart-clipper.popup.theme';

function hasHexaError(value: unknown): value is { __hexa_error__: string } {
  return !!value && typeof value === 'object' && '__hexa_error__' in value;
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  return window.localStorage.getItem(POPUP_THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

export function useDevtoolsData() {
  const runtimePort = inject(RuntimePort);
  const [clips, setClips] = useState<DevtoolsClipDiagnosticItem[]>([]);
  const [errors, setErrors] = useState<DevtoolsErrorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(POPUP_THEME_STORAGE_KEY, nextTheme);
    }
  }, []);

  const loadState = useCallback(async () => {
    try {
      setLoadError('');
      const hexaUIClient = inject(HexaUIClient);
      const response = await hexaUIClient.sendMessage<DevtoolsGetStateMessage, DevtoolsStateMessage>(backgroundApi.GetDevtoolsState, new DevtoolsGetStateMessage(Date.now(), 'devtools'));
      if (hasHexaError(response)) {
        throw new Error(response.__hexa_error__);
      }
      setClips(Array.isArray(response.clips) ? response.clips : []);
      setErrors(Array.isArray(response.errors) ? response.errors : []);
      setTheme(getStoredTheme());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load devtools state';
      console.error('[smart-clipper] Failed to load devtools state.', error);
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    loadState();

    const onStorageChange = (event: StorageEvent) => {
      if (event.key !== POPUP_THEME_STORAGE_KEY || !isThemeMode(event.newValue)) {
        return;
      }

      setTheme(event.newValue);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorageChange);
    }

    const unsubscribe = runtimePort.onMessage((message: any) => {
      if (!message || typeof message !== 'object') {
        return;
      }

      if (message.action === devtoolsHandlesApi.SyncClips) {
        const payload = message.payload as Partial<DevtoolsSyncClipsMessage>;
        setClips(Array.isArray(payload?.clips) ? payload.clips : []);
        return;
      }

      if (message.action === devtoolsHandlesApi.SyncErrors) {
        const payload = message.payload as Partial<DevtoolsSyncErrorsMessage>;
        setErrors(Array.isArray(payload?.errors) ? payload.errors : []);
        return;
      }

      if (message.action === devtoolsHandlesApi.SyncTheme) {
        const payload = message.payload as Partial<DevtoolsSyncThemeMessage>;
        if (!isThemeMode(payload?.theme)) {
          return;
        }

        setTheme(payload.theme);
      }
    });

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorageChange);
      }
    };
  }, [loadState, runtimePort, setTheme]);

  return { clips, errors, isLoading, loadError, reload: loadState, theme, setTheme };
}

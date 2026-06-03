import { HexaReducer, Reduce, Reducer } from '@hexajs-dev/core';
import { ClipVaultConfig, DEFAULT_CONFIG } from '../../contract/config';
import { ClipItem } from '../../contract/messages';
import * as BackgroundActions from './background.actions';

export interface BackgroundState {
  config: ClipVaultConfig;
  clips: ClipItem[];
}

@Reducer()
export class ConfigReducer extends HexaReducer<ClipVaultConfig> {

  @Reduce(BackgroundActions.CONFIG_LOADED)
  onConfigLoaded(_state: ClipVaultConfig, action: ReturnType<typeof BackgroundActions.configLoaded>): ClipVaultConfig {
    return { ...action.payload.config };
  }

  async initAsync(): Promise<ClipVaultConfig> {
    // Simulate async config loading (e.g. from storage) during reducer initialization
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ...DEFAULT_CONFIG });
      }, 100);
    });
  }
}

@Reducer()
export class ClipsReducer extends HexaReducer<ClipItem[]> {
  initialState: ClipItem[] = [];

  @Reduce(BackgroundActions.CLIPS_UPDATED)
  onClipsUpdated(_state: ClipItem[], action: ReturnType<typeof BackgroundActions.clipsUpdated>): ClipItem[] {
    return [...action.payload.clips];
  }
}

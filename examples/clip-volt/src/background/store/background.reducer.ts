import { HexaReducer, Reduce, Reducer } from '@hexajs/core';
import { ClipVaultConfig, DEFAULT_CONFIG } from '../../contract/config';
import { ClipItem } from '../../contract/messages';
import * as BackgroundActions from './background.actions';

export interface BackgroundState {
  config: ClipVaultConfig;
  clips: ClipItem[];
}

@Reducer()
export class ConfigReducer extends HexaReducer<ClipVaultConfig> {
  initialState: ClipVaultConfig = { ...DEFAULT_CONFIG };

  @Reduce(BackgroundActions.CONFIG_LOADED)
  onConfigLoaded(_state: ClipVaultConfig, action: ReturnType<typeof BackgroundActions.configLoaded>): ClipVaultConfig {
    return { ...action.payload.config };
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

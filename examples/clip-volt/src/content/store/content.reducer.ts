import { HexaReducer, Reduce, Reducer } from '@hexajs/core';
import { ClipVaultConfig, DEFAULT_CONFIG } from '../../contract/config';
import { ClipItem } from '../../contract/messages';
import * as ContentActions from './content.actions';

interface ClipsState {
  list: ClipItem[];
  filtered: ClipItem[];
}

export interface ContentState {
  clips: ClipsState;

  config: ClipVaultConfig;
}

@Reducer()
export class ContentClipsReducer extends HexaReducer<ClipsState> {
  initialState: ClipsState = { list: [], filtered: [] };

  @Reduce(ContentActions.CLIPS_SYNCED)
  onClipsSynced(state: ClipsState, action: ReturnType<typeof ContentActions.clipsSynced>): ClipsState {
    return { ...state, list: [...action.payload.clips] };
  }

  @Reduce(ContentActions.CLIP_ADDED)
  onClipAdded(state: ClipsState, action: ReturnType<typeof ContentActions.clipAdded>): ClipsState {
    return { ...state, list: [action.payload.clip, ...state.list.filter(c => c.id !== action.payload.clip.id)] };
  }

  @Reduce(ContentActions.CLIPS_FILTERED)
  onClipsFiltered(state: ClipsState, action: ReturnType<typeof ContentActions.clipsFiltered>): ClipsState {
    return { ...state, filtered: [...action.payload.filteredClips] };
  }
}

@Reducer()
export class ContentConfigReducer extends HexaReducer<ClipVaultConfig> {
  initialState: ClipVaultConfig = { ...DEFAULT_CONFIG };

  @Reduce(ContentActions.CONFIG_SYNCED)
  onConfigSynced(state: ClipVaultConfig, action: ReturnType<typeof ContentActions.configSynced>): ClipVaultConfig {
    return { ...action.payload.config };
  }
}

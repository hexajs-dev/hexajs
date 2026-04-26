import { createAction, props } from '@hexajs-dev/core';
import { ClipVaultConfig } from '../../contract/config';
import { ClipItem } from '../../contract/messages';

export const CLIP_ADDED = '[Content] Clip Added';
export const CLIPS_SYNCED = '[Content] Clips Synced';
export const CONFIG_SYNCED = '[Content] Config Synced';
export const CLIPS_FILTERED = '[Content] Clips Filtered';

export const clipAdded = createAction(CLIP_ADDED, props<{ clip: ClipItem }>());
export const clipsSynced = createAction(CLIPS_SYNCED, props<{ clips: ClipItem[] }>());
export const configSynced = createAction(CONFIG_SYNCED, props<{ config: ClipVaultConfig }>());
export const clipsFiltered = createAction(CLIPS_FILTERED, props<{ filteredClips: ClipItem[] }>());

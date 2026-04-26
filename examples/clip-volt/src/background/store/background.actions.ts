import { createAction, props } from '@hexajs-dev/core';
import { ClipVaultConfig } from '../../contract/config';
import { ClipItem } from '../../contract/messages';

export const CONFIG_LOADED = '[Background] Config Loaded';
export const CLIPS_UPDATED = '[Background] Clips Updated';

export const configLoaded = createAction(CONFIG_LOADED, props<{ config: ClipVaultConfig }>());
export const clipsUpdated = createAction(CLIPS_UPDATED, props<{ clips: ClipItem[] }>());

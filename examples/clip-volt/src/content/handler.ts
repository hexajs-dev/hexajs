import { Handler, Handle, HexaContentStore } from '@hexajs/core';
import { ClipVaultContent } from './content';
import { clipboardHandlesNamespace, ClipboardHandlesApi } from '../contract/api';
import { SyncClipsMessage, SyncConfigMessage } from '../contract/messages';
import { ContentState } from './store/content.reducer';
import { clipsSynced, configSynced } from './store/content.actions';

@Handler({ namespace: clipboardHandlesNamespace, Contents: [ClipVaultContent] })
export class ClipVaultHandler {
  constructor(private readonly store: HexaContentStore<ContentState>) {}

  @Handle(ClipboardHandlesApi.SyncClips)
  onSyncClips(payload: SyncClipsMessage): { status: string } {
    this.store.dispatch(clipsSynced({ clips: payload.clips }));
    return { status: 'received' };
  }

  @Handle(ClipboardHandlesApi.SyncConfig)
  onSyncConfig(payload: SyncConfigMessage): { status: string } {
    this.store.dispatch(configSynced({ config: payload.config }));
    return { status: 'received' };
  }
}

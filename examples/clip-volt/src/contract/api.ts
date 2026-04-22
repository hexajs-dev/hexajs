export const configNamespace = 'config' as const;

export const ConfigActionsApi = {
  Update: 'update',
  Get: 'get',
} as const;

export const configApi = {
  Update: `${configNamespace}:${ConfigActionsApi.Update}`,
  Get: `${configNamespace}:${ConfigActionsApi.Get}`,
} as const;

export const clipboardNamespace = 'clipboard' as const;

export const ClipboardActionsApi = {
  Add: 'add',
  Get: 'get',
  Remove: 'remove',
} as const;

export const clipboardApi = {
  Add: `${clipboardNamespace}:${ClipboardActionsApi.Add}`,
  Get: `${clipboardNamespace}:${ClipboardActionsApi.Get}`,
  Remove: `${clipboardNamespace}:${ClipboardActionsApi.Remove}`,
} as const;

export const clipboardHandlesNamespace = 'clipboard' as const;

export const ClipboardHandlesApi = {
  SyncClips: 'sync-clips',
  SyncConfig: 'sync-config',
} as const;

export const clipboardHandlesApi = {
  SyncClips: `${clipboardHandlesNamespace}:${ClipboardHandlesApi.SyncClips}`,
  SyncConfig: `${clipboardHandlesNamespace}:${ClipboardHandlesApi.SyncConfig}`,
} as const;

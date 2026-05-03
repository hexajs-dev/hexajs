---
title: StoragePort
description: API reference for StoragePort in the background context.
---

import StoragePortAPI from '../../reference-models/ports/background/storage/storage-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# StoragePort

`StoragePort` provides a unified interface to all browser storage areas - `local`, `sync`, `session`, and `managed` - with change notifications.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/storage/storage.port.ts`

## Key Methods

- `get(areaName: WebExtStorageAreaName, keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }>` - Read values from a storage area.
- `set(areaName: WebExtStorageAreaName, items: { [key: string]: any }): Promise<void>` - Write values to a storage area.
- `remove(areaName: WebExtStorageAreaName, keys: string | string[]): Promise<void>` - Delete specific keys from a storage area.
- `clear(areaName: WebExtStorageAreaName): Promise<void>` - Wipe an entire storage area.
- `onChangedAddListener(listener: (changes: WebExtStorageChangesMap, areaName: WebExtStorageAreaName) => void): void` - Subscribe to storage change events.
- `onChangedRemoveListener(listener: (changes: WebExtStorageChangesMap, areaName: WebExtStorageAreaName) => void): void` - Unsubscribe from storage change events.

## Usage

```typescript
import { StoragePort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class UserPreferencesService {
  constructor(private readonly storage: StoragePort) {}

  async getPreferences() {
    return this.storage.get('sync', ['theme', 'language', 'autoSync']);
  }

  async savePreferences(prefs: Record<string, unknown>) {
    await this.storage.set('sync', prefs);
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <StoragePortAPI />
</ApiReferenceAppendix>
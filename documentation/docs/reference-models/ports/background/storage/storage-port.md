---
title: Storage Port (ports)
description: Public API model reference for ports module packages/ports/src/background/storage/storage.port.ts.
---


### Classes

#### StoragePort

```ts
import { StoragePort } from '@hexajs-dev/ports';
```

```typescript
class StoragePort { ... }
```

#### Methods

**`clear()`**
```typescript
clear(areaName: HexaWebStorageAreaName): Promise<void>
```

**`get()`**
```typescript
get(areaName: HexaWebStorageAreaName, keys: string | string[] | {
    [key: string]: any;
} | null): Promise<{
    [key: string]: any;
}>
```

**`onChangedAddListener()`**
```typescript
onChangedAddListener(listener: (changes: HexaWebStorageChangesMap, areaName: HexaWebStorageAreaName) => void): void
```

**`onChangedRemoveListener()`**
```typescript
onChangedRemoveListener(listener: (changes: HexaWebStorageChangesMap, areaName: HexaWebStorageAreaName) => void): void
```

**`remove()`**
```typescript
remove(areaName: HexaWebStorageAreaName, keys: string | string[]): Promise<void>
```

**`set()`**
```typescript
set(areaName: HexaWebStorageAreaName, items: SetItems): Promise<void>
```

**`setAccessLevel()`**
```typescript
setAccessLevel(options: HexaWebStorageSetAccessLevelOptions): Promise<void>
```


### Supporting Types

#### SetItems

```typescript
interface SetItems {
  [key: string]: any;
}
```


---
title: Bookmarks Port (ports)
description: Public API model reference for ports module packages/ports/src/background/bookmarks/bookmarks.port.ts.
---


### Classes

#### BookmarksPort

```ts
import { BookmarksPort } from '@hexajs/ports';
```

```typescript
class BookmarksPort { ... }
```

#### Methods

**`create()`**
```typescript
create(bookmark: HexaWebBookmarkCreateArg): Promise<HexaWebBookmarkTreeNode>
```

**`get()`**
```typescript
get(idOrIdList: string | string[]): Promise<HexaWebBookmarkTreeNode[]>
```

**`getTree()`**
```typescript
getTree(): Promise<HexaWebBookmarkTreeNode[]>
```

**`move()`**
```typescript
move(id: string, destination: HexaWebBookmarkMoveDestination): Promise<HexaWebBookmarkTreeNode>
```

**`onChangedAddListener()`**
```typescript
onChangedAddListener(listener: (id: string, changeInfo: HexaWebBookmarkChanges) => void): void
```

**`onChangedRemoveListener()`**
```typescript
onChangedRemoveListener(listener: (id: string, changeInfo: HexaWebBookmarkChanges) => void): void
```

**`onCreatedAddListener()`**
```typescript
onCreatedAddListener(listener: (id: string, bookmark: HexaWebBookmarkTreeNode) => void): void
```

**`onCreatedRemoveListener()`**
```typescript
onCreatedRemoveListener(listener: (id: string, bookmark: HexaWebBookmarkTreeNode) => void): void
```

**`onMovedAddListener()`**
```typescript
onMovedAddListener(listener: (id: string, moveInfo: {
    parentId: string;
    index: number;
    oldParentId: string;
    oldIndex: number;
}) => void): void
```

**`onMovedRemoveListener()`**
```typescript
onMovedRemoveListener(listener: (id: string, moveInfo: {
    parentId: string;
    index: number;
    oldParentId: string;
    oldIndex: number;
}) => void): void
```

**`onRemovedAddListener()`**
```typescript
onRemovedAddListener(listener: (id: string, removeInfo: HexaWebBookmarkRemoveInfo) => void): void
```

**`onRemovedRemoveListener()`**
```typescript
onRemovedRemoveListener(listener: (id: string, removeInfo: HexaWebBookmarkRemoveInfo) => void): void
```

**`remove()`**
```typescript
remove(id: string): Promise<void>
```

**`removeTree()`**
```typescript
removeTree(id: string): Promise<void>
```

**`search()`**
```typescript
search(query: string | {
    query?: string;
    title?: string;
    url?: string;
}): Promise<HexaWebBookmarkTreeNode[]>
```

**`update()`**
```typescript
update(id: string, changes: HexaWebBookmarkChanges): Promise<HexaWebBookmarkTreeNode>
```


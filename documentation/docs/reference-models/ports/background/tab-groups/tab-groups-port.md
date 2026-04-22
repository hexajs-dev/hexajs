---
title: Tab Groups Port (ports)
description: Public API model reference for ports module packages/ports/src/background/tab-groups/tab-groups.port.ts.
---


### Classes

#### TabGroupsPort

```ts
import { TabGroupsPort } from '@hexajs/ports';
```

```typescript
class TabGroupsPort { ... }
```

#### Methods

**`get()`**
```typescript
get(groupId: number): Promise<HexaWebTabGroup>
```

**`query()`**
```typescript
query(queryInfo: HexaWebTabGroupQueryInfo): Promise<HexaWebTabGroup[]>
```

**`update()`**
```typescript
update(groupId: number, updateProperties: Partial<HexaWebTabGroup>): Promise<HexaWebTabGroup>
```


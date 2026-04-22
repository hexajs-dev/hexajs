---
title: Browsing Data Port (ports)
description: Public API model reference for ports module packages/ports/src/background/browsing-data/browsing-data.port.ts.
---


### Classes

#### BrowsingDataPort

```ts
import { BrowsingDataPort } from '@hexajs/ports';
```

```typescript
class BrowsingDataPort { ... }
```

#### Methods

**`remove()`**
```typescript
remove(options: HexaWebRemovalOptions, dataToRemove: HexaWebDataTypeSet): Promise<void>
```

**`removeCache()`**
```typescript
removeCache(options: HexaWebRemovalOptions): Promise<void>
```

**`removeCookies()`**
```typescript
removeCookies(options: HexaWebRemovalOptions): Promise<void>
```

**`removeHistory()`**
```typescript
removeHistory(options: HexaWebRemovalOptions): Promise<void>
```


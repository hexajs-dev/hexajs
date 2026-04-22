---
title: History Port (ports)
description: Public API model reference for ports module packages/ports/src/background/history/history.port.ts.
---


### Classes

#### HistoryPort

```ts
import { HistoryPort } from '@hexajs/ports';
```

```typescript
class HistoryPort { ... }
```

#### Methods

**`addUrl()`**
```typescript
addUrl(details: AddUrlDetails): Promise<void>
```

**`deleteRange()`**
```typescript
deleteRange(range: DeleteRangeRange): Promise<void>
```

**`deleteUrl()`**
```typescript
deleteUrl(details: DeleteUrlDetails): Promise<void>
```

**`search()`**
```typescript
search(query: HexaWebHistorySearchQuery): Promise<HexaWebHistoryItem[]>
```


### Supporting Types

#### AddUrlDetails

```typescript
interface AddUrlDetails {
  url: string;
  title?: string;
  transition?: string;
  visitTime?: number;
}
```

#### DeleteRangeRange

```typescript
interface DeleteRangeRange {
  startTime: number;
  endTime: number;
}
```

#### DeleteUrlDetails

```typescript
interface DeleteUrlDetails {
  url: string;
}
```


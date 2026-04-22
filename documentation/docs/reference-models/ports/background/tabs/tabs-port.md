---
title: Tabs Port (ports)
description: Public API model reference for ports module packages/ports/src/background/tabs/tabs.port.ts.
---


### Classes

#### TabsPort

```ts
import { TabsPort } from '@hexajs/ports';
```

```typescript
class TabsPort { ... }
```

#### Methods

**`broadcastMessage()`**
```typescript
broadcastMessage(message: any, queryInfo?: HexaWebTabsQueryInfo): Promise<void>
```

**`emitTabMessage()`**
```typescript
emitTabMessage(tabId: number, message: any): Promise<void>
```

**`getTab()`**
```typescript
getTab(tabId: number): Promise<HexaWebTab>
```

**`queryTabs()`**
```typescript
queryTabs(queryInfo: HexaWebTabsQueryInfo): Promise<HexaWebTab[]>
```

**`sendTabMessage()`**
```typescript
sendTabMessage(tabId: number, message: any): Promise<any>
```


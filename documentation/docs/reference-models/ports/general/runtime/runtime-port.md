---
title: Runtime Port (ports)
description: Public API model reference for ports module packages/ports/src/general/runtime/runtime.port.ts.
---


### Classes

#### RuntimePort

```ts
import { RuntimePort } from '@hexajs/ports';
```

```typescript
class RuntimePort { ... }
```

#### Methods

**`onMessage()`**
```typescript
onMessage(callback: (message: any, sender: webExt.runtime.MessageSender, sendResponse: (response?: any) => void) => void): () => void
```

**`onSuspend()`**
```typescript
onSuspend(callback: () => void): void
```

**`reload()`**
```typescript
reload(): void
```

**`sendMessage()`**
```typescript
sendMessage(message: any): Promise<any>
```


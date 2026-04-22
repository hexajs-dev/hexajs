---
title: Container (core)
description: Public API model reference for core module packages/core/src/content/handler/container.ts.
---


### Classes

#### HandlerContainer

```ts
import { HandlerContainer } from '@hexajs/core';
```

```typescript
class HandlerContainer { ... }
```

#### Methods

**`destroy()`**
> Destroys the handler container:
- Removes the runtime message listener
- Clears all registered handlers
- Resets piped client
```typescript
destroy(): void
```

**`registerMulticast()`**
```typescript
registerMulticast(name: string, handler: ContentHandlerFn): (name: string, handler: ContentHandlerFn) => void
```

**`registerUnicast()`**
> Called by the Bootstrap Generator
```typescript
registerUnicast(name: string, handler: ContentHandlerFn): (name: string, handler: ContentHandlerFn) => void
```

**`setPipedClient()`**
```typescript
setPipedClient(client: HexaClientBase): (client: HexaClientBase) => void
```


### Types & Interfaces

#### ContentHandlerFn

```ts
import { ContentHandlerFn } from '@hexajs/core';
```

```typescript
type ContentHandlerFn = (payload: any, sender: unknown) => any | Promise<any>;
```


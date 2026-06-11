---
title: Container (core)
description: Public API model reference for core module packages/core/src/content/handler/container.ts.
---


### Classes

#### HandlerContainer

```ts
import { HandlerContainer } from '@hexajs-dev/core';
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
registerMulticast(name: string, handler: ContentHandlerFn, policy?: Readonly<HexaMessageBoundaryPolicy>): (name: string, handler: ContentHandlerFn, policy?: Readonly<HexaMessageBoundaryPolicy>) => void
```

**`registerUnicast()`**
> Called by the Bootstrap Generator
```typescript
registerUnicast(name: string, handler: ContentHandlerFn, policy?: Readonly<HexaMessageBoundaryPolicy>): (name: string, handler: ContentHandlerFn, policy?: Readonly<HexaMessageBoundaryPolicy>) => void
```

**`setPipeRunner()`**
```typescript
setPipeRunner(runner: HexaPipeRunner): (runner: HexaPipeRunner) => void
```


### Types & Interfaces

#### ContentHandlerFn

```ts
import { ContentHandlerFn } from '@hexajs-dev/core';
```

```typescript
type ContentHandlerFn = (payload: any, sender: unknown) => any | Promise<any>;
```


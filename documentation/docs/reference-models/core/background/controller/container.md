---
title: Container (core)
description: Public API model reference for core module packages/core/src/background/controller/container.ts.
---


### Classes

#### ControllerContainer

```ts
import { ControllerContainer } from '@hexajs/core';
```

```typescript
class ControllerContainer { ... }
```

#### Methods

**`destroy()`**
```typescript
destroy(): void
```

**`registerMulticast()`**
```typescript
registerMulticast(name: string, handler: BackgroundHandlerFn): (name: string, handler: BackgroundHandlerFn) => void
```

**`registerUnicast()`**
> Called by the Bootstrap Generator
```typescript
registerUnicast(name: string, handler: BackgroundHandlerFn): (name: string, handler: BackgroundHandlerFn) => void
```

**`setPipedClient()`**
```typescript
setPipedClient(client: HexaClientBase): (client: HexaClientBase) => void
```


### Types & Interfaces

#### BackgroundHandlerFn

```ts
import { BackgroundHandlerFn } from '@hexajs/core';
```

```typescript
type BackgroundHandlerFn = (payload: any, sender: unknown) => any | Promise<any>;
```


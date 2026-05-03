---
title: Container (core)
description: Public API model reference for core module packages/core/src/background/controller/container.ts.
---


### Classes

#### ControllerContainer

```ts
import { ControllerContainer } from '@hexajs-dev/core';
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

**`setPipeRunner()`**
```typescript
setPipeRunner(runner: HexaPipeRunner): (runner: HexaPipeRunner) => void
```


### Types & Interfaces

#### BackgroundHandlerFn

```ts
import { BackgroundHandlerFn } from '@hexajs-dev/core';
```

```typescript
type BackgroundHandlerFn = (payload: any, sender: unknown) => any | Promise<any>;
```


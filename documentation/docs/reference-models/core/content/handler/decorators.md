---
title: Decorators (core)
description: Public API model reference for core module packages/core/src/content/handler/decorators.ts.
---


#### @Handle

For Request/Response (Unary). 
CLI should enforce that handleName is UNIQUE per context.

```ts
import { Handle } from '@hexajs-dev/core';
```

```typescript
@Handle(handleName: string)
```

#### @Handler

```ts
import { Handler } from '@hexajs-dev/core';
```

```typescript
@Handler(options: HandlerOptions)
```

#### @Subscribe

For Fire-and-Forget (Multicast).
Multiple methods can listen to the same eventName.

```ts
import { Subscribe } from '@hexajs-dev/core';
```

```typescript
@Subscribe(eventName: string)
```


### Supporting Types

#### HandlerOptions

```typescript
interface HandlerOptions {
  namespace: string;
  Contents?: ContentClass[];
}
```


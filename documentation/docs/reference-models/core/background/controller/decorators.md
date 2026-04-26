---
title: Decorators (core)
description: Public API model reference for core module packages/core/src/background/controller/decorators.ts.
---


#### @Action

For Request/Response (Unary). 
CLI should enforce that actionName is UNIQUE per context.

```ts
import { Action } from '@hexajs-dev/core';
```

```typescript
@Action(actionName: string)
```

#### @Controller

```ts
import { Controller } from '@hexajs-dev/core';
```

```typescript
@Controller(options: ControllerOptions)
```

#### @On

For Fire-and-Forget (Multicast).
Multiple methods can listen to the same eventName.

```ts
import { On } from '@hexajs-dev/core';
```

```typescript
@On(eventName: string)
```


### Supporting Types

#### ControllerOptions

```typescript
interface ControllerOptions {
  namespace: string;
}
```


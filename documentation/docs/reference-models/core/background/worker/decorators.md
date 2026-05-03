---
title: Decorators (core)
description: Public API model reference for core module packages/core/src/background/worker/decorators.ts.
---


#### @Worker

```ts
import { Worker } from '@hexajs-dev/core';
```

```typescript
@Worker(options: WorkerOptions)
```


### Types & Interfaces

#### WorkerOptions

```ts
import { WorkerOptions } from '@hexajs-dev/core';
```

```typescript
interface WorkerOptions {
    name: string;
    environment?: WorkerEnvironment;
}
```


### Enums

#### WorkerEnvironment

```ts
import { WorkerEnvironment } from '@hexajs-dev/core';
```

```typescript
enum WorkerEnvironment {
    Compute = 'compute',
    DOM = 'dom'
}
```


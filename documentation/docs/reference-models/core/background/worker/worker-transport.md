---
title: Worker Transport (core)
description: Public API model reference for core module packages/core/src/background/worker/worker-transport.ts.
---


### Classes

#### WorkerTransportEngine

```ts
import { WorkerTransportEngine } from '@hexajs-dev/core';
```

```typescript
class WorkerTransportEngine { ... }
```

#### Methods

**`ensureHostIsRunning()`**
```typescript
static ensureHostIsRunning(environment: WorkerEnvironment): Promise<void>
```

**`executeMethod()`**
```typescript
static executeMethod(workerName: string, method: string, args: any[], onEvent?: (event: WorkerCallEvent) => void): Promise<any>
```


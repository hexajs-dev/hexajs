---
title: Events (core)
description: Public API model reference for core module packages/core/src/background/worker/events.ts.
---


### Types & Interfaces

#### WorkerCallEvent

Event emitted from a worker while a proxied worker method is executing.

```ts
import { WorkerCallEvent } from '@hexajs-dev/core';
```

```typescript
interface WorkerCallEvent<T = unknown> {
    callId: string;
    workerName: string;
    eventType: string;
    data?: T;
}
```


### Functions

#### emitWorkerEvent

Emits a host-visible event from the currently executing worker call.

Use this inside a worker method to stream progress, status updates, or other
intermediate signals back to the host code that wrapped the proxy with
.

```ts
import { emitWorkerEvent } from '@hexajs-dev/core';
```

```typescript
function emitWorkerEvent<T = unknown>(eventType: string, data?: T): void
```


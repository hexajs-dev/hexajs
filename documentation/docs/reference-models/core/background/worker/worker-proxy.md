---
title: Worker Proxy (core)
description: Public API model reference for core module packages/core/src/background/worker/worker-proxy.ts.
---


### Functions

#### createWorkerProxy

```ts
import { createWorkerProxy } from '@hexajs-dev/core';
```

```typescript
function createWorkerProxy(workerName: string, environment: WorkerEnvironment): any
```

#### withWorkerEvents

Binds a listener to a worker proxy so host code can receive streaming events
emitted from inside the worker via .

The returned value keeps the same callable worker surface. Worker methods
still resolve their final Promise result as usual; this only adds event
notifications while the call is in flight.

Typical usage is to inspect `event.eventType` and then narrow `event.data`
to the payload shape for that event.

```ts
import { withWorkerEvents } from '@hexajs-dev/core';
```

```typescript
function withWorkerEvents<T extends object>(workerProxy: T, onEvent: (event: WorkerCallEvent) => void): T
```


---
title: Container (common)
description: Public API model reference for common module packages/common/src/di/container.ts.
---


### Functions

#### injectWorker

Resolves a worker proxy from the DI container of the current context.

Use this for on-demand worker access, for example:
`readonly ocrWorker = injectWorker(OcrWorker)`.
Prefer `@InjectWorker()` on class properties when you want build-time validation.

```ts
import { injectWorker } from '@hexajs-dev/common';
```

```typescript
function injectWorker<C extends ClassToken>(token: C): InstanceType<C>
```


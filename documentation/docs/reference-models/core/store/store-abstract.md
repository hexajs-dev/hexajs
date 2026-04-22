---
title: Store Abstract (core)
description: Public API model reference for core module packages/core/src/store/store.abstract.ts.
---


### Functions

#### select

```ts
import { select } from '@hexajs/core';
```

```typescript
function select<T, V>(selector: (state: T) => V): (source$: Observable<T>) => Observable<V>
```


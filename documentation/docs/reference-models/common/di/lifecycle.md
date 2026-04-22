---
title: Lifecycle (common)
description: Public API model reference for common module packages/common/src/di/lifecycle.ts.
---


### Types & Interfaces

#### OnDestroy

```ts
import { OnDestroy } from '@hexajs/common';
```

```typescript
interface OnDestroy {
    onDestroy(): void | Promise<void>;
}
```

#### OnInit

```ts
import { OnInit } from '@hexajs/common';
```

```typescript
interface OnInit {
    onInit(): void | Promise<void>;
}
```


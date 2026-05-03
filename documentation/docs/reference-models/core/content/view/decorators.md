---
title: Decorators (core)
description: Public API model reference for core module packages/core/src/content/view/decorators.ts.
---


#### @InjectView

```ts
import { InjectView } from '@hexajs-dev/core';
```

```typescript
@InjectView()
```

#### @View

```ts
import { View } from '@hexajs-dev/core';
```

```typescript
@View(options: ViewOptions)
```


### Types & Interfaces

#### ViewOptions

```ts
import { ViewOptions } from '@hexajs-dev/core';
```

```typescript
interface ViewOptions {
    id: string;
    component: any;
    styles?: string;
    anchorSelector?: string;
}
```


---
title: React Shadow Renderer (ui)
description: Public API model reference for ui module packages/ui/src/services/react-shadow-renderer.ts.
---


### Classes

#### ReactShadowRenderer

```ts
import { ReactShadowRenderer } from '@hexajs-dev/ui';
```

```typescript
class ReactShadowRenderer { ... }
```

#### Methods

**`mount()`**
```typescript
static mount(options: ShadowRenderOptions): () => void
```


### Types & Interfaces

#### ShadowRenderOptions

```ts
import { ShadowRenderOptions } from '@hexajs-dev/ui';
```

```typescript
interface ShadowRenderOptions {
    id: string;
    component: React.FC<any>;
    controllerInstance: any;
    cssText?: string;
    anchorSelector?: string;
}
```


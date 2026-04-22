---
title: Decorators (core)
description: Public API model reference for core module packages/core/src/content/decorators.ts.
---


#### @Content

```ts
import { Content } from '@hexajs/core';
```

```typescript
@Content(options: ContentOptions)
```


### Enums

#### ContentRunAt

```ts
import { ContentRunAt } from '@hexajs/core';
```

```typescript
enum ContentRunAt {
    DocumentStart = 'document_start',
    DocumentEnd = 'document_end',
    DocumentIdle = 'document_idle'
}
```


### Supporting Types

#### ContentOptions

```typescript
interface ContentOptions {
  matches: Array<string>;
  runAt: ContentRunAt;
  allFrames?: boolean;
}
```


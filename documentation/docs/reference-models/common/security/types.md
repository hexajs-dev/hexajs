---
title: Types (common)
description: Public API model reference for common module packages/common/src/security/types.ts.
---


### Types & Interfaces

#### AllowExternalOptions

```ts
import { AllowExternalOptions } from '@hexajs-dev/common';
```

```typescript
interface AllowExternalOptions {
    ids?: readonly string[];
    origins?: readonly string[];
}
```

#### HexaMessageBoundaryPolicy

```ts
import { HexaMessageBoundaryPolicy } from '@hexajs-dev/common';
```

```typescript
interface HexaMessageBoundaryPolicy {
    mode: HexaMessageBoundaryMode;
    ids?: readonly string[];
    origins?: readonly string[];
}
```

#### HexaMessageBoundaryMode

```ts
import { HexaMessageBoundaryMode } from '@hexajs-dev/common';
```

```typescript
type HexaMessageBoundaryMode = 'internal-only' | 'allow-external';
```


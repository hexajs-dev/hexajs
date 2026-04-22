---
title: Hexa Client Base (core)
description: Public API model reference for core module packages/core/src/services/hexa-client.base.ts.
---


### Classes

#### HexaPipeValidationError

```ts
import { HexaPipeValidationError } from '@hexajs/core';
```

```typescript
class HexaPipeValidationError extends Error { ... }
```

#### Properties
- `code`
- `details`


### Types & Interfaces

#### HexaPipeInput

```ts
import { HexaPipeInput } from '@hexajs/core';
```

```typescript
interface HexaPipeInput {
    route: string;
    payload: unknown;
    sender: unknown;
    context: HexaPipeContextName;
}
```

#### HexaPipeValidationResult

```ts
import { HexaPipeValidationResult } from '@hexajs/core';
```

```typescript
interface HexaPipeValidationResult {
    valid: boolean;
    error?: string;
    code?: string;
    details?: unknown;
}
```

#### HexaPipeContextName

```ts
import { HexaPipeContextName } from '@hexajs/core';
```

```typescript
type HexaPipeContextName = 'background' | 'content';
```

#### HexaPipeFn

```ts
import { HexaPipeFn } from '@hexajs/core';
```

```typescript
type HexaPipeFn = (input: HexaPipeInput) => unknown | HexaPipeValidationResult | Promise<unknown | HexaPipeValidationResult>;
```


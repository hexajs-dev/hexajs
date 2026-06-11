---
title: Metadata (common)
description: Public API model reference for common module packages/common/src/security/metadata.ts.
---


### Decorators

#### @getClassBoundaryPolicy

```ts
import { getClassBoundaryPolicy } from '@hexajs-dev/common';
```

```typescript
@getClassBoundaryPolicy
```

#### @getMethodBoundaryPolicy

```ts
import { getMethodBoundaryPolicy } from '@hexajs-dev/common';
```

```typescript
@getMethodBoundaryPolicy
```

#### @resolveRouteBoundaryPolicy

```ts
import { resolveRouteBoundaryPolicy } from '@hexajs-dev/common';
```

```typescript
@resolveRouteBoundaryPolicy
```

#### @setClassBoundaryPolicy

```ts
import { setClassBoundaryPolicy } from '@hexajs-dev/common';
```

```typescript
@setClassBoundaryPolicy
```

#### @setMethodBoundaryPolicy

```ts
import { setMethodBoundaryPolicy } from '@hexajs-dev/common';
```

```typescript
@setMethodBoundaryPolicy
```


### Functions

#### createAllowExternalPolicy

```ts
import { createAllowExternalPolicy } from '@hexajs-dev/common';
```

```typescript
function createAllowExternalPolicy(options?: AllowExternalOptions): Readonly<HexaMessageBoundaryPolicy>
```


### Constants

#### INTERNAL_ONLY_BOUNDARY_POLICY

```ts
import { INTERNAL_ONLY_BOUNDARY_POLICY } from '@hexajs-dev/common';
```

```typescript
const INTERNAL_ONLY_BOUNDARY_POLICY: Readonly<HexaMessageBoundaryPolicy>;
```


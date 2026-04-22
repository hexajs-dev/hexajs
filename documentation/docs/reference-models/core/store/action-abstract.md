---
title: Action Abstract (core)
description: Public API model reference for core module packages/core/src/store/action.abstract.ts.
---


### Functions

#### createAction

Create an action creator with optional props

```ts
import { createAction } from '@hexajs/core';
```

```typescript
function createAction<T extends string>(type: T): () => HexaAction<T>
```

#### props

Props creator for actions with payload

```ts
import { props } from '@hexajs/core';
```

```typescript
function props<P>(): P
```


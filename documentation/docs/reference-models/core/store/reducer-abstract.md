---
title: Reducer Abstract (core)
description: Public API model reference for core module packages/core/src/store/reducer.abstract.ts.
---


### Functions

#### createReducer

Creates a reducer function from an initial state and one or more action handlers

```ts
import { createReducer } from '@hexajs-dev/core';
```

```typescript
function createReducer<T>(initialState: T, ...handlers: OnHandler<T, any>[]): (state: T | undefined, action: HexaAction | HexaActionWithPayload<string, any>) => T
```


---
title: Decorators (core)
description: Public API model reference for core module packages/core/src/store/decorators.ts.
---


#### @Reduce

```ts
import { Reduce } from '@hexajs-dev/core';
```

```typescript
@Reduce<P>(type: string)
```

#### @Reducer

```ts
import { Reducer } from '@hexajs-dev/core';
```

```typescript
@Reducer()
```

#### @State

```ts
import { State } from '@hexajs-dev/core';
```

```typescript
@State<T>(options: StateOptions)
```


### Supporting Types

#### StateOptions

```typescript
interface StateOptions {
  context: InjectableContext;
  state: {
    [K in keyof T]: new () => HexaReducer<T[K]>;
};
}
```


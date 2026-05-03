---
title: Actions (core)
description: Public API model reference for core module packages/core/src/store/actions.ts.
---


### Classes

#### Actions

Public read-only action stream — injected by user services and effects.

Extends Observable so TypeScript prevents calling .next(), .error(), .complete().

```ts
import { Actions } from '@hexajs-dev/core';
```

```typescript
class Actions extends Observable<HexaAction> { ... }
```

#### ActionsSubject

Internal writable action stream — used only by the store's dispatch method.
NOT exposed to user code; the generator registers it in the DI container.

```ts
import { ActionsSubject } from '@hexajs-dev/core';
```

```typescript
class ActionsSubject extends Subject<HexaAction> { ... }
```


### Functions

#### ofType

RxJS operator that filters actions by one or more action types.

```ts
import { ofType } from '@hexajs-dev/core';
```

```typescript
function ofType(...allowedTypes: string[]): OperatorFunction<HexaAction, HexaAction>
```


---
title: Effect (core)
description: Public API model reference for core module packages/core/src/store/effect.ts.
---


### Types & Interfaces

#### EffectConfig

```ts
import { EffectConfig } from '@hexajs-dev/core';
```

```typescript
interface EffectConfig {
    dispatch?: boolean;
}
```


### Functions

#### createEffect

Creates a managed effect from an RxJS pipeline factory.

The returned Observable is tagged so the framework can:
1. Auto-subscribe it at bootstrap time
2. Route emitted actions back to store.dispatch() (unless dispatch: false)
3. Recover from errors (dead-stream protection)
4. Auto-unsubscribe on lifecycle destroy (HMR, navigation, suspend)

Must be used inside an

```ts
import { createEffect } from '@hexajs-dev/core';
```

```typescript
function createEffect(factory: () => Observable<HexaAction>, config?: EffectConfig): Observable<HexaAction>
```

#### subscribeEffects

Discovers all createEffect-tagged properties on an instance, subscribes each
with dead-stream recovery, and routes dispatching effects back to the store.

Returns a composite Subscription that unsubscribes all effects at once.
The generator calls this at bootstrap and adds the subscription to lifecycle cleanup.

```ts
import { subscribeEffects } from '@hexajs-dev/core';
```

```typescript
function subscribeEffects(instance: any, dispatch: (action: HexaAction) => void): Subscription
```


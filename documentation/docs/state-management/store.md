---
title: Store Setup
sidebar_position: 2
description: Configure state for Background and Content contexts with reducer slices and @State registration.
---

import StoreAbstractAPI from '../reference-models/core/store/store-abstract.md';
import StoreDecoratorsAPI from '../reference-models/core/store/decorators.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Store Setup

HexaJS supports store state in **Background** and **Content** contexts.

- Use `HexaBackgroundStore<T>` for background-owned state.
- Use `HexaContentStore<T>` for page-scoped content state.
- Use `@State<T>({ context, state })` to register reducer slices.

Managed UI does not host `@State` and should communicate through clients/messages.

## 1) Define state and reducer slices

Example from the Background context:

```ts
import { HexaReducer, Reduce, Reducer } from '@hexajs-dev/core';
import * as BackgroundActions from './background.actions';

export interface LastContentCallState {
  message: string;
  timestamp: number;
  tabId?: number;
}

export interface BackgroundState {
  lastContentCall: LastContentCallState;
}

@Reducer()
export class LastContentCallReducer extends HexaReducer<LastContentCallState> {
  initialState: LastContentCallState = { message: '', timestamp: 0 };

  @Reduce(BackgroundActions.CONTENT_CALLED)
  onContentCalled(
    state: LastContentCallState,
    action: ReturnType<typeof BackgroundActions.contentCalled>
  ): LastContentCallState {
    if (!action.payload?.message || !action.payload?.timestamp) return state;
    return { ...action.payload };
  }
}
```

## 2) Register state with @State

```ts
import { State } from '@hexajs-dev/core';
import { HexaContext } from '@hexajs-dev/common';
import { BackgroundState, LastContentCallReducer } from './background.reducer';

@State<BackgroundState>({
  context: HexaContext.Background,
  state: {
    lastContentCall: LastContentCallReducer,
  },
})
export class BackgroundStateConfig {}
```

Use `HexaContext.Content` for content-side state configs.

## 3) Inject and consume the store

Background example:

```ts
import { Background, HexaBackgroundStore, select } from '@hexajs-dev/core';
import { Subscription } from 'rxjs';
import { BackgroundState } from './store/background.reducer';

@Background()
export class ClipVoltBackground {
  subscriptions: Subscription = new Subscription();

  constructor(private readonly store: HexaBackgroundStore<BackgroundState>) {}

  onInit(): void {
    this.subscriptions.add(
      this.store.pipe(select(s => s.lastContentCall)).subscribe(value => {
        console.log('Last content call:', value);
      })
    );
  }

  onDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
```

Content example uses `HexaContentStore<ContentState>` in the same way.

## 4) CLI commands you will use

Generate a reducer:

```bash
hexa generate reducer last-content-call background
```

Generate or extend state config:

```bash
hexa generate state last-content-call background
```

Content variant:

```bash
hexa generate reducer last-background-call content
hexa generate state last-background-call content
```

Hexa CLI validates store context values as `background` or `content`.

<ApiReferenceAppendix>
<StoreAbstractAPI />

<StoreDecoratorsAPI />
</ApiReferenceAppendix>

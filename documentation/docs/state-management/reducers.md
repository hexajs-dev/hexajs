---
title: Reducers
sidebar_position: 4
description: Implement reducer classes that react to action types and return immutable next state.
---

import ReducerAbstractAPI from '../reference-models/core/store/reducer-abstract.md';
import StoreDecoratorsAPI from '../reference-models/core/store/decorators.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Reducers

Reducers are responsible for turning `(currentState, action)` into `nextState`.

In HexaJS, reducer classes use decorators:

- `@Reducer()` on the class.
- `@Reduce(ACTION_TYPE)` on each handler method.

## Reducer example

```ts
import { HexaReducer, Reduce, Reducer } from '@hexajs/core';
import * as BackgroundActions from './background.actions';

@Reducer()
export class LastContentCallReducer extends HexaReducer<LastContentCallState> {
  initialState: LastContentCallState = {
    message: '',
    timestamp: 0,
  };

  @Reduce(BackgroundActions.CONTENT_CALLED)
  onContentCalled(
    state: LastContentCallState,
    action: ReturnType<typeof BackgroundActions.contentCalled>
  ): LastContentCallState {
    if (!action.payload?.message || !action.payload?.timestamp) {
      return state;
    }
    return { ...action.payload };
  }
}
```

## Reducer rules

- Return a **new object** when state changes.
- Return `state` unchanged when payload is invalid or action is not applicable.
- Keep reducer methods deterministic and side-effect free.
- Perform logging/IO in services/controllers/handlers, not reducers.

## CLI and compiler behavior

- Use `hexa generate reducer <name> <context>` to scaffold reducer classes.
- Use `hexa generate state <name> <context>` to register reducer slices under `@State(...)`.
- The CLI scanner (`packages/cli/src/compiler/store/reducer/scanner.ts`) discovers reducer metadata during build.

## Where reducers are used

Reducers power both:

- Background store transitions driven by controllers/actions.
- Content store transitions driven by handlers/actions.

<ApiReferenceAppendix>
<ReducerAbstractAPI />
</ApiReferenceAppendix>

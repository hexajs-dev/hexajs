---
title: Effects
sidebar_position: 5
description: Advanced effect pipelines for reactive store orchestration, action streams, and side-effect isolation.
---

# Effects

> **Target Audience:** Advanced
> **Goal:** Orchestrate reactive side effects from store actions without polluting reducers.

Reducers should stay deterministic and side-effect free. Effects are the reactive boundary where you listen to actions, join state, call external services, and optionally dispatch follow-up actions.

In HexaJS, effects are built on RxJS and tagged through `createEffect(...)`. The runtime then discovers and subscribes them during bootstrap.

## Why effects exist

Use effects when reducer logic is no longer just `state + action -> nextState`.

Typical cases:

- derive a follow-up action from multiple store slices,
- react to one action by calling a service,
- coordinate async flows without putting RxJS subscriptions inside reducers,
- run logging, analytics, or persistence work with `dispatch: false`.

## Runtime model

HexaJS effect support is centered on two functions:

- `createEffect(...)`: tags an Observable so the framework knows it is an effect.
- `subscribeEffects(...)`: scans an injectable instance, subscribes every tagged effect, and routes emitted actions back into `store.dispatch(...)`.

At runtime the flow is:

1. An `@Injectable()` service exposes effect properties.
2. Each effect property calls `createEffect(() => observable$, config?)`.
3. The generated bootstrap resolves that service.
4. `subscribeEffects(...)` discovers the tagged properties.
5. Emitted actions are dispatched back into the store unless `dispatch: false` is set.

## Example: filter content clips after sync

The `clip-volt` example shows the core pattern clearly.

```ts
import { Injectable, inject } from '@hexajs/common';
import { Actions, HexaContentStore, createEffect, ofType, select } from '@hexajs/core';
import { map, withLatestFrom } from 'rxjs/operators';
import * as ContentActions from './content.actions';
import { ContentState } from './content.reducer';
import { selectClips, selectConfig } from './content.selectors';

@Injectable()
export class ContentEffects {
  private actions$ = inject(Actions);
  private store = inject<HexaContentStore<ContentState>>(HexaContentStore);

  filterClips$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ContentActions.CLIPS_SYNCED, ContentActions.CONFIG_SYNCED),
      withLatestFrom(
        this.store.pipe(select(selectClips)),
        this.store.pipe(select(selectConfig))
      ),
      map(([, clips, config]) => {
        const filteredClips = this.applyFilters(clips, config);
        return ContentActions.clipsFiltered({ filteredClips });
      })
    )
  );
}
```

This effect does three things:

1. listens for two action types,
2. joins the latest store state needed for the decision,
3. emits a new action with the derived payload.

That keeps reducers simple while still giving you a typed, reactive pipeline.

## Core building blocks

### `Actions`

Inject `Actions` when the effect should react to the action stream.

```ts
private actions$ = inject(Actions);
```

This is the primary source for event-driven store orchestration.

### `ofType(...)`

Use `ofType(...)` to narrow the stream to the actions that should trigger the effect.

```ts
this.actions$.pipe(ofType(loadItems, refreshItems));
```

This keeps effect pipelines targeted and avoids repeated condition checks in `map` or `tap` stages.

### `select(...)` and state joins

Use store selectors when the effect depends on current state in addition to the incoming action.

```ts
withLatestFrom(
  this.store.pipe(select(selectClips)),
  this.store.pipe(select(selectConfig))
)
```

This pattern is especially useful when actions announce that something changed, but the final derived output depends on multiple slices.

## Dispatching effects

By default, effects are dispatching effects. If an effect emits values that look like actions, HexaJS sends them back through `dispatch(...)`.

```ts
loadSucceeded$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadRequested),
    map(() => loadCompleted())
  )
);
```

The runtime only dispatches emissions shaped like actions with a string `type` field. This keeps accidental emissions from being routed into the store.

## Non-dispatching effects

For telemetry, logging, imperative integration, or other side-effect-only flows, set `dispatch: false`.

```ts
audit$ = createEffect(() =>
  this.actions$.pipe(
    ofType(saveCompleted),
    tap(action => this.logger.log('Saved item', action.payload.id))
  ),
  { dispatch: false }
);
```

Use this sparingly. If the pipeline is producing new state transitions, prefer returning a real action instead.

## Resilience and dead-stream recovery

HexaJS protects effects from permanently dying after an unhandled error.

The runtime wraps each effect with:

- `catchError(...)` to log the failure,
- `EMPTY` to complete the broken inner stream,
- `retry({ delay: () => timer(0) })` to re-subscribe immediately.

That means a transient failure does not permanently disable the effect pipeline for the lifetime of the context.

This is useful for extension runtimes where content and background contexts may live for a long time and must survive intermittent failures.

## Design guidance

- Keep reducers pure and move orchestration into effects.
- Keep effect classes injectable so they can resolve services and store instances cleanly.
- Keep effects coarse-grained enough to express a workflow, not one trivial operator per class.
- Keep state joins explicit with selectors instead of reaching into raw state objects ad hoc.
- Keep `dispatch: false` for true side-effect-only work.
- Keep external IO isolated behind services instead of embedding it directly in large operator chains.

## When not to use effects

Do not use effects when:

- the operation is a synchronous state transition that belongs entirely in a reducer,
- the logic is view-local and does not belong to the store lifecycle,
- a handler or controller can perform the work directly before dispatching a final action.

Effects are for reactive orchestration, not as a replacement for every service method.

## Related reading

- [Store Setup](./store)
- [Actions](./actions)
- [Reducers](./reducers)
- [RxJS and Selectors](./rxjs)
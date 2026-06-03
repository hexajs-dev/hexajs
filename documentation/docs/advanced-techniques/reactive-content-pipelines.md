---
title: Reactive Content Pipelines
sidebar_position: 3
description: Compose advanced effects in the content store — multi-action triggers, state joins with withLatestFrom, selector-based derivation, and keeping reducers pure.
---

# Reactive Content Pipelines

> **Target Audience:** Advanced
> **Goal:** Build content-side effect pipelines that derive state from multiple upstream actions and store slices without touching reducers.

Reducers answer the question "given this action, what is the next state?" Effects answer "given this action stream, what should happen next?" When derived state depends on more than one store slice or more than one triggering action, an effect is the right place to put that logic.

This recipe walks through the `ContentEffects` class from **clip-volt** ([github.com/hexajs-dev/examples](https://github.com/hexajs-dev/examples)).

## The scenario

clip-volt's content store holds two slices:

- `clips` — the full list received from background, plus a filtered view.
- `config` — privacy settings, URL rules, storage limits, and theme.

The filtered view must be recalculated whenever *either* slice changes. That is two possible trigger actions (`CLIPS_SYNCED`, `CONFIG_SYNCED`), and the derivation needs the *latest* value from both slices simultaneously.

A reducer cannot do this. A reducer only sees the action it is called for, not other slices of state. An effect can.

## Store layout

```ts
// src/content/store/content.reducer.ts
export interface ClipsState {
  list: ClipItem[];
  filtered: ClipItem[];
}

export interface ContentState {
  clips: ClipsState;
  config: ClipVaultConfig;
}
```

Three reducers, three action types:

| Action | Reducer | What it does |
|---|---|---|
| `CLIPS_SYNCED` | `ContentClipsReducer` | Replaces `clips.list` with the broadcast payload |
| `CONFIG_SYNCED` | `ContentConfigReducer` | Replaces `config` with the broadcast payload |
| `CLIPS_FILTERED` | `ContentClipsReducer` | Replaces `clips.filtered` with the derived result |

The effect is the only thing that dispatches `CLIPS_FILTERED`. Reducers stay pure.

## Selectors: typed accessors for store slices

Define selectors in a separate file. They are plain functions — no magic, no decoration — so they are easy to test independently.

```ts
// src/content/store/content.selectors.ts
import { ContentState } from './content.reducer';

export const selectClips     = (state: ContentState) => state.clips;
export const selectConfig    = (state: ContentState) => state.config;
export const selectFiltered  = (state: ContentState) => state.clips?.filtered ?? [];
export const selectTheme     = (state: ContentState) => state.config.theme;
export const selectExcluded  = (state: ContentState) => state.config.urlRules.exclude;
```

Using a named selector instead of an inline lambda in `store.pipe(select(...))` means you only define the path once, and you can test it in isolation with a plain object.

## The effect: ofType + withLatestFrom

```ts
// src/content/store/content.effects.ts
import { HexaContext, Injectable, inject } from '@hexajs-dev/common';
import { Actions, HexaContentStore, createEffect, ofType, select } from '@hexajs-dev/core';
import { map, withLatestFrom } from 'rxjs/operators';
import * as ContentActions from './content.actions';
import { ContentState } from './content.reducer';
import { selectClips, selectConfig } from './content.selectors';

@Injectable({ context: HexaContext.Content })
export class ContentEffects {
  private actions$ = inject(Actions);
  private store   = inject(HexaContentStore<ContentState>);

  filterClips$ = createEffect(() =>
    this.actions$.pipe(
      // Trigger on either action — clips list changed OR config changed
      ofType(ContentActions.CLIPS_SYNCED, ContentActions.CONFIG_SYNCED),
      // Join the latest value of both slices at the moment the action fires
      withLatestFrom(
        this.store.pipe(select(selectClips)),
        this.store.pipe(select(selectConfig)),
      ),
      map(([, clips, config]) => {
        const filteredClips = applyFilters(clips.list, config);
        return ContentActions.clipsFiltered({ filteredClips });
      }),
    )
  );
}
```

What this pipeline does, step by step:

1. `ofType(CLIPS_SYNCED, CONFIG_SYNCED)` — narrows the action stream to the two events that signal data changed.
2. `withLatestFrom(select(clips), select(config))` — snapshots both slices at the moment the trigger fires. These are the current values *after* the triggering action's reducer has already run.
3. `map(...)` — derives the filtered list and wraps it in a new action.
4. `createEffect(...)` — tags the observable; the runtime subscribes it and routes the emitted action back through `store.dispatch`.

The reducer for `CLIPS_FILTERED` is a pure replace:

```ts
@Reduce(ContentActions.CLIPS_FILTERED)
onClipsFiltered(
  state: ClipsState,
  action: ReturnType<typeof ContentActions.clipsFiltered>
): ClipsState {
  return { ...state, filtered: [...action.payload.filteredClips] };
}
```

## withLatestFrom: timing guarantees

`withLatestFrom` snapshots the secondary observables at the *moment the primary emits*. In the context of a store effect:

- The action fires.
- HexaJS dispatches it through all registered reducers first, updating the store.
- Only then does the action reach the `Actions` stream that effects subscribe to.

This means by the time `withLatestFrom` snapshots `selectClips` and `selectConfig`, the triggering action's reducer has already run. If `CLIPS_SYNCED` fired, `clips.list` already contains the new value when the effect reads it.

This ordering is what makes the pattern safe. Do not try to derive state in a reducer based on other slices — you are not guaranteed ordering there.

## Non-dispatching effect: side-effect-only work

Some content-side work should react to actions without producing new store state — logging, DOM side effects, analytics. Use `{ dispatch: false }`:

```ts
auditClip$ = createEffect(
  () =>
    this.actions$.pipe(
      ofType(ContentActions.CLIP_ADDED),
      tap(action => this.logger.log('Clip added:', action.payload.clip.id)),
    ),
  { dispatch: false },
);
```

Keep `dispatch: false` effects narrow. If you find yourself doing complex derivation in a `dispatch: false` effect, the logic probably belongs in a dispatching effect that produces an action for the reducer.

## Consuming derived state in the content entry

The content entry subscribes to `selectFiltered` — the already-derived slice — not `selectClips`:

```ts
// src/content/content.ts
import { select } from '@hexajs-dev/core';
import { selectFiltered } from './store/content.selectors';

constructor(private readonly store: HexaContentStore<ContentState>, ...) {
  this.subscriptions.add(
    this.store.pipe(select(selectFiltered)).subscribe(filtered => {
      this.overlay.updateClips(filtered);
    }),
  );
}
```

The overlay never receives raw clips — it always receives the already-filtered view. If config changes, the effect re-derives, the store updates `filtered`, and the subscription fires again. The overlay code has zero filtering logic.

## Resilience

HexaJS wraps effects with `catchError` + `retry`. If `applyFilters` throws an unexpected error, the effect re-subscribes rather than dying permanently. Keep filter logic defensive — null-check inputs and handle empty arrays explicitly.

```ts
function applyFilters(clips: ClipItem[], config: ClipVaultConfig): ClipItem[] {
  if (!clips || clips.length === 0) return [];
  // ... filtering logic
}
```

## Pitfalls

- **Joining store state in a reducer.** Reducers receive the single action and the single slice they manage — not the whole store. Multi-slice derivation always belongs in an effect.
- **Using `combineLatest` instead of `withLatestFrom`.** `combineLatest` fires whenever *any* of the streams emits, not just the primary. If you use it here, config changes would also trigger a re-filter through the action stream independently, producing duplicate `CLIPS_FILTERED` dispatches and potential double renders. `withLatestFrom` fires only when the primary action does.
- **Dispatching `CLIPS_FILTERED` from a reducer or directly from the content entry.** Only effects should dispatch derived state actions. If you dispatch `CLIPS_FILTERED` from two places, you get two sources of truth.

## Related reading

- [Effects](../state-management/effects.md)
- [RxJS and Selectors](../state-management/rxjs.md)
- [Actions](../state-management/actions.md)
- [Cross-Context State Sync](./cross-context-state-sync.md)

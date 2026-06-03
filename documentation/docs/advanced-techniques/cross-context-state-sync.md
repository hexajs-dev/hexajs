---
title: Cross-Context State Sync
sidebar_position: 2
description: Persist background state with StoragePort and initState, sync to content via broadcast, and keep stores coherent across service-worker restarts.
---

# Cross-Context State Sync

> **Target Audience:** Advanced
> **Goal:** Design a background-owned store that survives service-worker restarts using `initState` and a persistence effect, then stays coherent with content-side mirrors using broadcast and `*Synced` actions.

Browser extension contexts are isolated processes. Background holds the persistent source of truth. Content scripts run per-page and start cold on every navigation. Service workers can be terminated and restarted at any time — meaning in-memory background state is lost unless it is persisted to storage.

This recipe covers both problems: persisting background state correctly, and keeping content stores in sync.

This recipe walks through the pattern used in **clip-volt** ([github.com/hexajs-dev/examples](https://github.com/hexajs-dev/examples)).

## The ownership model

```
StoragePort (local)
     │  initState (load)          persistence effect (write-back)
     │       ↓                          ↑
     └──► Background store ──(broadcast)──► Content store (mirror)
               ▲                                    │
          Controller (mutations)          Handler (receive syncs)
```

Two separate concerns:
- **Loading:** the reducer's `initState` populates the store slice from storage when the service worker boots.
- **Persisting:** a `dispatch: false` effect subscribes to the store state and writes it back to storage whenever it changes.
- **Syncing:** the controller broadcasts after every mutation so open content scripts mirror the latest state.

## 1. Persistence service using StoragePort

`StoragePort` is the HexaJS abstraction over `chrome.storage` / `browser.storage`. Platform differences are handled internally — you always call the same methods.

```ts
// src/background/services/clipboard-manager.service.ts
import { Injectable, HexaContext } from '@hexajs-dev/common';
import { StoragePort } from '@hexajs-dev/ports';
import { ClipItem } from '../../contract/messages';

const CLIPS_KEY = 'clips';

@Injectable({ context: HexaContext.Background })
export class ClipboardManagerService {
  constructor(private readonly storagePort: StoragePort) {}

  async loadClips(): Promise<ClipItem[]> {
    const result = await this.storagePort.get('local', CLIPS_KEY);
    const stored = result[CLIPS_KEY];
    return Array.isArray(stored) ? stored : [];
  }

  async persistClips(clips: ClipItem[]): Promise<void> {
    await this.storagePort.set('local', { [CLIPS_KEY]: clips });
  }

  addClip(clips: ClipItem[], clip: ClipItem, maxItems = 200): ClipItem[] {
    return [clip, ...clips.filter(c => c.id !== clip.id)].slice(0, maxItems);
  }

  removeClip(clips: ClipItem[], clipId: string): ClipItem[] {
    return clips.filter(c => c.id !== clipId);
  }
}
```

`'local'` storage persists across service-worker restarts. `'session'` is discarded when the browser closes. `'sync'` roams across devices but has tight size limits.

## 2. Reducer with initState: load state from storage on boot

`initState` is called by the generated bootstrap before the context starts handling any messages. It replaces `initialState` for that slice — the store starts with real persisted data, not an empty default.

```ts
// src/background/store/background.reducer.ts
import { HexaReducer, Reduce, Reducer } from '@hexajs-dev/core';
import { inject } from '@hexajs-dev/common';
import { ClipItem } from '../../contract/messages';
import { ClipboardManagerService } from '../services/clipboard-manager.service';
import * as BackgroundActions from './background.actions';

export interface BackgroundState {
  clips: ClipItem[];
}

@Reducer()
export class ClipsReducer extends HexaReducer<ClipItem[]> {
  initialState: ClipItem[] = [];

  async initState(): Promise<ClipItem[]> {
    // Runs once at bootstrap — loads persisted clips from storage.
    // The store starts with real data before any controller handles a message.
    return inject(ClipboardManagerService).loadClips();
  }

  @Reduce(BackgroundActions.CLIPS_UPDATED)
  onClipsUpdated(_state: ClipItem[], action: ReturnType<typeof BackgroundActions.clipsUpdated>): ClipItem[] {
    return [...action.payload.clips];
  }
}
```

`inject(ClipboardManagerService)` works inside `initState` because the DI container is already set up before bootstrap calls it.

## 3. Persistence effect: subscribe to state, write back on every change

The effect does not listen to the `Actions` stream — it listens directly to the store state. Every time the `clips` slice changes (regardless of which action caused it), the effect persists the new value to storage.

```ts
// src/background/store/background.effects.ts
import { HexaContext, Injectable, inject } from '@hexajs-dev/common';
import { HexaBackgroundStore, createEffect, select } from '@hexajs-dev/core';
import { skip, switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { BackgroundState } from './background.reducer';
import { ClipboardManagerService } from '../services/clipboard-manager.service';

@Injectable({ context: HexaContext.Background })
export class BackgroundEffects {
  private store = inject(HexaBackgroundStore<BackgroundState>);
  private clipboardManager = inject(ClipboardManagerService);

  // Subscribe to state changes and persist — no ofType, reacts to every mutation
  persistClips$ = createEffect(() =>
    this.store.pipe(
      select(state => state.clips),
      skip(1), // skip the initial emission from initState — it was just loaded from storage
      switchMap(clips => from(this.clipboardManager.persistClips(clips))),
    ),
    { dispatch: false },
  );
}
```

Key points:
- **No `ofType`** — the effect subscribes to the state observable directly. It doesn't matter which action caused the change; if `clips` changed, it persists.
- **`skip(1)`** — the store emits the initial state (loaded by `initState`) on subscription. Skipping that first emission avoids writing back data that was just read from storage.
- **`switchMap`** — cancels any in-flight write if a new state arrives before the previous `persistClips` resolves. Safe because writes are full replacements.
- **`dispatch: false`** — this effect produces no actions, it only writes to storage.

## 4. Background actions and state registration

```ts
// src/background/store/background.actions.ts
import { createAction, props } from '@hexajs-dev/core';
import { ClipItem } from '../../contract/messages';

export const CLIPS_UPDATED = '[Background] Clips Updated';
export const clipsUpdated = createAction(CLIPS_UPDATED, props<{ clips: ClipItem[] }>());
```

```ts
// src/background/store/background.state.ts
import { State } from '@hexajs-dev/core';
import { HexaContext } from '@hexajs-dev/common';
import { BackgroundState, ClipsReducer } from './background.reducer';

@State<BackgroundState>({
  context: HexaContext.Background,
  state: { clips: ClipsReducer },
})
export class BackgroundStateConfig {}
```

## 5. Background controller: dispatch → broadcast

The controller no longer calls `persistClips` directly. It just mutates state — the effect handles persistence automatically.

```ts
// src/background/controller.ts
import { Controller, Action, HexaBackgroundClient, HexaBackgroundStore } from '@hexajs-dev/core';
import { ClipboardManagerService } from './services/clipboard-manager.service';
import { BackgroundState } from './store/background.reducer';
import { clipsUpdated } from './store/background.actions';
import { AddClipMessage, ClipsResponseMessage, SyncClipsMessage, GetClipsMessage } from '../contract/messages';

@Controller({ namespace: 'clipboard' })
export class ClipboardController {
  constructor(private readonly client: HexaBackgroundClient, private readonly clipboardManager: ClipboardManagerService, private readonly store: HexaBackgroundStore<BackgroundState>) {}

  @Action('add')
  async onAddClip(payload: AddClipMessage): Promise<ClipsResponseMessage> {
    const current = await this.clipboardManager.loadClips();
    const clips = this.clipboardManager.addClip(current, payload.clip);

    // Dispatch updates the store — the persistence effect handles writing to storage
    this.store.dispatch(clipsUpdated({ clips }));

    // Broadcast the new state to all open tabs
    this.client
      .broadcast('clipboard:sync-clips', new SyncClipsMessage(clips))
      .catch(err => console.error('Broadcast failed:', err));

    return new ClipsResponseMessage(clips);
  }

  @Action('get')
  async onGetClips(_payload: GetClipsMessage): Promise<ClipsResponseMessage> {
    const clips = await this.clipboardManager.loadClips();
    return new ClipsResponseMessage(clips);
  }
}
```

The `get` action reads from storage directly rather than from the in-memory store. This is a safety net: if a controller action is called before the `persistClips$` effect has completed writing after a rapid burst of dispatches, storage will have the last confirmed-written value.

## 6. Content store: mirror actions

```ts
// src/content/store/content.actions.ts
import { createAction, props } from '@hexajs-dev/core';
import { ClipItem } from '../../contract/messages';

export const CLIPS_SYNCED = '[Content] Clips Synced';
export const clipsSynced = createAction(CLIPS_SYNCED, props<{ clips: ClipItem[] }>());
```

```ts
// src/content/store/content.reducer.ts
import { HexaReducer, Reduce, Reducer } from '@hexajs-dev/core';
import { ClipItem } from '../../contract/messages';
import * as ContentActions from './content.actions';

export interface ContentState {
  clips: ClipItem[];
}

@Reducer()
export class ContentClipsReducer extends HexaReducer<ClipItem[]> {
  initialState: ClipItem[] = [];

  @Reduce(ContentActions.CLIPS_SYNCED)
  onClipsSynced(_state: ClipItem[], action: ReturnType<typeof ContentActions.clipsSynced>): ClipItem[] {
    return [...action.payload.clips];
  }
}
```

## 7. Content entry: hydrate on init, stay live via handler

```ts
// src/content/content.ts
import { Content, ContentRunAt, HexaContentClient, HexaContentStore } from '@hexajs-dev/core';
import { OnInit, OnDestroy } from '@hexajs-dev/common';
import { ContentState } from './store/content.reducer';
import { clipsSynced } from './store/content.actions';
import { GetClipsMessage, ClipsResponseMessage } from '../contract/messages';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class MyContent implements OnInit, OnDestroy {
  constructor(private readonly store: HexaContentStore<ContentState>, private readonly client: HexaContentClient) {}

  async onInit(): Promise<void> {
    await this.loadInitialState();
  }

  onDestroy(): void {}

  private async loadInitialState(): Promise<void> {
    try {
      const response = await this.client.sendMessage<GetClipsMessage, ClipsResponseMessage>('clipboard:get', new GetClipsMessage(Date.now()));
      if (response?.clips) {
        this.store.dispatch(clipsSynced({ clips: response.clips }));
      }
    } catch {
      // Continue with empty state if background is unreachable at startup
    }
  }
}
```

```ts
// src/content/handler.ts
import { Handler, Handle, HexaContentStore } from '@hexajs-dev/core';
import { ContentState } from './store/content.reducer';
import { clipsSynced } from './store/content.actions';
import { SyncClipsMessage } from '../contract/messages';
import { MyContent } from './content';

@Handler({ namespace: 'clipboard', Contents: [MyContent] })
export class ClipboardHandler {
  constructor(private readonly store: HexaContentStore<ContentState>) {}

  @Handle('sync-clips')
  onSyncClips(payload: SyncClipsMessage): void {
    this.store.dispatch(clipsSynced({ clips: payload.clips }));
  }
}
```

## The hydration-vs-broadcast race

Content boots asynchronously. A broadcast may arrive before `loadInitialState()` resolves. Two approaches:

**Option A: Last-write wins.** Both the hydration response and any broadcast dispatch `clipsSynced` as full replacements. Whichever resolves last wins — always correct for wholesale replacements.

**Option B: Sequence-stamp the payload.** Add `updatedAt: number` to sync messages. The reducer ignores any payload older than what it already holds.

```ts
// Option B — stale-broadcast guard
@Reduce(ContentActions.CLIPS_SYNCED)
onClipsSynced(state: ClipsState, action: ReturnType<typeof clipsSynced>): ClipsState {
  if (action.payload.updatedAt <= state.updatedAt) return state;
  return { clips: action.payload.clips, updatedAt: action.payload.updatedAt };
}
```

## Pitfalls

- **Using `ofType` in a persistence effect.** If you filter to specific action types, you will miss any other action that modifies that slice. Subscribe to the state slice directly — let the store determine whether the value actually changed (it only emits when the reference changes).
- **Skipping `skip(1)`.** Without it, the initial state loaded by `initState` gets written straight back to storage on subscription — a no-op at best, a race condition with concurrent reads at worst.
- **Using `mergeMap` instead of `switchMap`.** `mergeMap` lets concurrent writes pile up. `switchMap` cancels the previous in-flight write when a newer state arrives, which is correct for full-replacement writes.
- **Forgetting the hydration step in content.** Content only stays live while the tab is open. New tabs opened after the last broadcast will start empty until they hydrate via the `get` action.

## Related reading

- [Store Setup](../state-management/store.md)
- [Effects](../state-management/effects.md)
- [Reducers](../state-management/reducers.md)
- [Controllers & Actions](../core-fundamentals/controllers.md)
- [Handlers & Handle](../core-fundamentals/handlers.md)
- [API Reference — StoragePort](../api-reference/background/storage-port.md)
- [Reactive Content Pipelines](./reactive-content-pipelines.md)

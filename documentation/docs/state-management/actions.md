---
title: Actions
sidebar_position: 3
description: Define typed actions with createAction and props to drive store updates predictably.
---

import ActionAbstractAPI from '../reference-models/core/store/action-abstract.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Actions

Actions are explicit events that describe a state transition. Reducers listen to action type constants and derive next state from payload.

## Action shape in HexaJS

HexaJS action creators are built with:

- `createAction(type)`
- `createAction(type, props<Payload>())`

```ts
import { createAction, props } from '@hexajs/core';

export const CONTENT_CALLED = '[Background] Content Called';

export const contentCalled = createAction(
  CONTENT_CALLED,
  props<{ message: string; timestamp: number; tabId: number }>()
);
```

## Naming conventions

Use stable type strings with context prefixes:

- `[Background] Content Called`
- `[Content] Background Called`

This keeps reducer bindings readable and avoids collisions across larger projects.

## Dispatching actions

From a controller or handler, dispatch action objects through the injected store:

```ts
this.store.dispatch(contentCalled({
  message: payload.message,
  timestamp: payload.timestamp,
  tabId: sender.tab?.id ?? -1,
}));
```

## Notes

- `props<P>()` is for payload typing and action creator shape.
- Keep action files close to their context store folder (for example `src/background/store` and `src/content/store`).
- Pair this page with Reducers to complete the flow.

<ApiReferenceAppendix>
<ActionAbstractAPI />
</ApiReferenceAppendix>

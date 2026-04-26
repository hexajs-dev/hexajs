---
title: RxJS and Selectors
sidebar_position: 5
description: Consume store state with select and compose custom RxJS pipes for clean reactive flows.
---

import StoreAbstractAPI from '../reference-models/core/store/store-abstract.md';

# RxJS and Selectors

HexaJS stores expose reactive APIs through RxJS through the `pipe(...)` method, which accepts RxJS operators like `select(...)` for reactive state access.

- `store.pipe(select(...))` subscribes to a state slice with `distinctUntilChanged` semantics.

## Prefer select for slice subscriptions

```ts
import { select } from '@hexajs-dev/core';

this.store.pipe(select(s => s.lastBackgroundCall)).subscribe(value => {
  console.log('Last background call:', value);
});
```

## Add custom pipes

You can chain additional operators after `select`:

```ts
import { filter, map } from 'rxjs';
import { select } from '@hexajs-dev/core';

this.store
  .pipe(select(s => s.lastBackgroundCall))
  .pipe(
    filter(v => !!v.message),
    map(v => `${v.message} @ ${new Date(v.timestamp).toLocaleTimeString()}`)
  )
  .subscribe(line => this.logger.log(line));
```

## Lifecycle-safe subscriptions

Background and Content classes should dispose subscriptions in `onDestroy()`:

```ts
import { Subscription } from 'rxjs';

subscriptions: Subscription = new Subscription();

onInit(): void {
  this.subscriptions.add(
    this.store.pipe(select(s => s.lastContentCall)).subscribe()
  );
}

onDestroy(): void {
  this.subscriptions.unsubscribe();
}
```

This pattern avoids leaks and duplicate listeners during extension lifecycle restarts.


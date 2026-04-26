---
title: Handlers & Handle
sidebar_position: 5
description: Learn how to declare content handlers, bind them to content entries, and handle namespaced actions.
---

import HandlerDecoratorsAPI from '../reference-models/core/content/handler/decorators.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Handlers

Handlers are content-context message endpoints. They receive actions routed from background and can subscribe to multicast events.

## Generate a Handler

```bash
hexa generate handler tabs --namespace tabs
```

Then attach the handler to a specific content entry class:

```bash
hexa add handler TabsHandler MyContentEntry
```

`@Handle` must be unique by full route key. You cannot declare two handles that resolve to the same `namespace:handle` path anywhere in the content context.

## Handler Example

```ts
import { Handler, Handle } from '@hexajs-dev/core';
import { HexaContentStore } from '@hexajs-dev/core';
import { LoggerService } from '../services/logger.service';
import { MyContentEntry } from './content';
import { ContentState } from './store/content.state';
import { backgroundCalled } from './store/content.actions';

@Handler({ namespace: 'tabs', Contents: [MyContentEntry] })
export class TabsHandler {
  constructor(private logger: LoggerService, private store: HexaContentStore<ContentState>) {}

  @Handle('active')
  onActive(payload: { tabId: number }): { ok: boolean } {
    this.logger.log('Background returned active tab id:', payload.tabId);
    this.store.dispatch(backgroundCalled({ message: `tab ${payload.tabId}`, timestamp: Date.now() }));
    return { ok: true };
  }
}
```

## Multicast Subscriptions

Use `@Subscribe` when one content handler listens to events pushed from background:

```ts
import { Handler, Subscribe } from '@hexajs-dev/core';
import { LoggerService } from '../services/logger.service';
import { MyContentEntry } from './content';

@Handler({ namespace: 'audit', Contents: [MyContentEntry] })
export class AuditHandler {
  constructor(private logger: LoggerService) {}

  @Subscribe('high-risk')
  onHighRisk(payload: { message: string }): void {
    this.logger.warn('Audit event received:', payload.message);
  }
}
```

## Notes

- Handlers are content-only classes and should inject content/general services.
- `@Handle` is unicast. Only one handler can exist for a given `namespace:handle` route.
- Prefer services and store abstractions in handlers, not direct browser APIs.
- Use `HexaContentStore<T>` + `dispatch(...)` to reflect routed messages into local content state.
- Namespace plus method decorator name forms the final route key: `namespace:name`.
- Pair handlers with Browser-Agnostic Messaging docs for request/response routing patterns.

<ApiReferenceAppendix>
<HandlerDecoratorsAPI />
</ApiReferenceAppendix>
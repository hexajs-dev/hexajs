---
title: Controllers & Actions
sidebar_position: 4
description: Learn how to declare background controllers and define typed actions using ports and DI.
---

import ControllerDecoratorsAPI from '../reference-models/core/background/controller/decorators.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Controllers & Actions

Controllers are background-context message endpoints. They expose namespaced actions and can dispatch events.

## Generate a Controller

```bash
hexa generate controller tabs --namespace tabs
```

`@Controller` requires a namespace object. Action names are combined as `namespace:action` during AOT scanning.

`@Action` must be unique by full route key. You cannot declare two actions that resolve to the same `namespace:action` path anywhere in the background context.

## Background Controller Example

```ts
import { Controller, Action } from '@hexajs-dev/core';
import { TabsPort } from '@hexajs-dev/ports';

@Controller({ namespace: 'tabs' })
export class TabsController {
  constructor(private tabsPort: TabsPort) {}

  @Action('active')
  async activeTab(): Promise<{ tabId: number }> {
    const tabs = await this.tabsPort.queryTabs({ active: true, currentWindow: true });
    return { tabId: tabs[0]?.id ?? -1 };
  }
}
```

## Fire-and-Forget Events

Use `@On` for background events that do not need request-response semantics:

```ts
import { Controller, On } from '@hexajs-dev/core';
import { NotificationsPort } from '@hexajs-dev/ports';

@Controller({ namespace: 'audit' })
export class AuditController {
  constructor(private notifications: NotificationsPort) {}

  @On('high-risk')
  async onHighRisk(payload: { title: string; message: string }): Promise<void> {
    await this.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: payload.title,
      message: payload.message,
    });
  }
}
```

## Notes

- Prefer ports (`@hexajs-dev/ports`) over direct `chrome.*` or `browser.*` API calls.
- `@Action` is unicast. Only one handler can exist for a given `namespace:action` route.
- Keep controller classes background-focused and delegate reusable logic to services.
- Dispatch store actions from controllers when background state must change.
- Use lifecycle hooks (`onInit`/`onDestroy`) for subscription setup/cleanup.
- See Handlers for content-side endpoints, State Management for store usage, and Browser-Agnostic Messaging for routing and ports.

<ApiReferenceAppendix>
<ControllerDecoratorsAPI />
</ApiReferenceAppendix>

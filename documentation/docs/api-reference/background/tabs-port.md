---
title: TabsPort
description: API reference for TabsPort in the background context.
---

import TabsPortAPI from '../../reference-models/ports/background/tabs/tabs-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# TabsPort

`TabsPort` queries, communicates with, and broadcasts messages across browser tabs, serving as the primary channel between the background service worker and active pages.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/tabs/tabs.port.ts`

## Key Methods

- `getTab(tabId: number): Promise<WebExtTab>` - Retrieve tab metadata by ID.
- `queryTabs(queryInfo: WebExtTabsQueryInfo): Promise<WebExtTab[]>` - Find tabs matching a filter.
- `sendTabMessage(tabId: number, message: any): Promise<any>` - Send a message and await a response from a tab.
- `emitTabMessage(tabId: number, message: any): Promise<void>` - Fire-and-forget message to a tab.
- `broadcastMessage(message: any, queryInfo?: WebExtTabsQueryInfo): Promise<void>` - Send a message to all matching tabs.

## Usage

```typescript
import { TabsPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class TabCoordinatorService {
  constructor(private readonly tabs: TabsPort) {}

  async notifyActiveTab(payload: unknown) {
    const [activeTab] = await this.tabs.queryTabs({ active: true, currentWindow: true });
    if (activeTab?.id != null) {
      await this.tabs.emitTabMessage(activeTab.id, { type: 'UPDATE', payload });
    }
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <TabsPortAPI />
</ApiReferenceAppendix>
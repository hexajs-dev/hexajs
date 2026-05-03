---
title: WebNavigationPort
description: API reference for WebNavigationPort in the background context.
---

import WebNavigationPortAPI from '../../reference-models/ports/background/web-navigation/web-navigation-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# WebNavigationPort

`WebNavigationPort` observes the navigation lifecycle of browser tabs, emitting events at each stage from before-navigate through commit to completion.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/web-navigation/web-navigation.port.ts`

## Key Methods

- `onBeforeNavigateAddListener(listener: (details: any) => void, filter?: WebExtWebNavigationEventFilter): void` - Subscribe before a navigation begins.
- `onBeforeNavigateRemoveListener(listener: (details: any) => void): void` - Unsubscribe from before-navigate events.
- `onCommittedAddListener(listener: (details: any) => void, filter?: WebExtWebNavigationEventFilter): void` - Subscribe when a navigation is committed.
- `onCommittedRemoveListener(listener: (details: any) => void): void` - Unsubscribe from committed events.
- `onCompletedAddListener(listener: (details: WebExtWebNavigationOnCompletedDetails) => void, filter?: WebExtWebNavigationEventFilter): void` - Subscribe when a navigation fully completes.
- `onCompletedRemoveListener(listener: (details: WebExtWebNavigationOnCompletedDetails) => void): void` - Unsubscribe from completed events.

## Usage

```typescript
import { WebNavigationPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class PageLoadTrackerService {
  constructor(private readonly webNavigation: WebNavigationPort) {}

  startTracking() {
    this.webNavigation.onCompletedAddListener(
      (details) => this.handlePageLoad(details.tabId, details.url),
      { url: [{ hostSuffix: 'example.com' }] },
    );
  }

  private handlePageLoad(tabId: number, url: string) {}
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <WebNavigationPortAPI />
</ApiReferenceAppendix>
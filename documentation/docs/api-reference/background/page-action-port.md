---
title: PageActionPort
description: API reference for PageActionPort in the background context.
---

import PageActionPortAPI from '../../reference-models/ports/background/page-action/page-action-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# PageActionPort

`PageActionPort` is the Manifest V2 per-tab action button API; it is superseded by [`ActionPort`](./action-port.md) for all new development.

:::warning Deprecated
This port targets the legacy `page_action` MV2 API. Use [`ActionPort`](./action-port.md) for all new implementations.
:::

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/page-action/page-action.port.ts`

## Key Methods

- `show(tabId: number): Promise<void>` - Show the page action icon for a tab.
- `hide(tabId: number): Promise<void>` - Hide the page action icon for a tab.
- `setTitle(details: { tabId: number; title?: string }): Promise<void>` - Set tooltip text for a tab.
- `setIcon(details: { tabId: number; path?: string | { [size: number]: string }; imageData?: any }): Promise<void>` - Set icon for a tab.
- `setPopup(details: { tabId: number; popup: string }): Promise<void>` - Assign popup HTML for a tab.
- `onClickedAddListener(listener: (tab: WebExtTab) => void): void` - Subscribe to icon click events.
- `onClickedRemoveListener(listener: (tab: WebExtTab) => void): void` - Unsubscribe from click events.

## Usage

```typescript
import { PageActionPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class LegacyPageActionService {
  constructor(private readonly pageAction: PageActionPort) {}

  activateForTab(tabId: number) {
    this.pageAction.show(tabId);
    this.pageAction.setTitle({ tabId, title: 'HexaJS active on this page' });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <PageActionPortAPI />
</ApiReferenceAppendix>
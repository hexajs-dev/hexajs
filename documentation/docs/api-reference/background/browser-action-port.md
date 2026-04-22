---
title: BrowserActionPort
description: API reference for BrowserActionPort in the background context.
---

import BrowserActionPortAPI from '../../reference-models/ports/background/browser-action/browser-action-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# BrowserActionPort

`BrowserActionPort` is the Manifest V2 toolbar button API; it is superseded by [`ActionPort`](./action-port.md) for all new development.

:::warning Deprecated
This port targets the legacy `browser_action` MV2 API. Use [`ActionPort`](./action-port.md) for all new implementations.
:::

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/browser-action/browser-action.port.ts`

## Key Methods

- `setTitle(details: { title: string; tabId?: number }): Promise<void>` - Set button tooltip text.
- `setBadgeText(details: { text: string; tabId?: number }): Promise<void>` - Set badge label.
- `setBadgeBackgroundColor(details: { color: string; tabId?: number }): Promise<void>` - Set badge color.
- `setIcon(details: { path?: string | { [size: number]: string }; tabId?: number; imageData?: any }): Promise<void>` - Set button icon.

## Usage

```typescript
import { BrowserActionPort } from '@hexajs/ports';
import { Injectable, InjectableContext } from '@hexajs/common';

@Injectable({ context: InjectableContext.Background })
export class LegacyStatusService {
  constructor(private readonly browserAction: BrowserActionPort) {}

  async setActiveState(tabId: number) {
    await this.browserAction.setBadgeText({ text: 'ON', tabId });
    await this.browserAction.setBadgeBackgroundColor({ color: '#107C10', tabId });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <BrowserActionPortAPI />
</ApiReferenceAppendix>
---
title: ActionPort
description: API reference for ActionPort in the background context.
---

import ActionPortAPI from '../../reference-models/ports/background/action/action-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# ActionPort

`ActionPort` controls the extension's toolbar button — its badge, icon, title, and popup — across all supported browsers.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/action/action.port.ts`

## Key Methods

- `setTitle(details: { title: string; tabId?: number }): Promise<void>` - Set button tooltip text.
- `setBadgeText(details: { text: string; tabId?: number }): Promise<void>` - Set badge label on button.
- `setBadgeBackgroundColor(details: { color: string; tabId?: number }): Promise<void>` - Set badge background color.
- `setIcon(details: { path?: string | { [size: number]: string }; tabId?: number; imageData?: any }): Promise<void>` - Set button icon.
- `setPopup(details: { popup: string; tabId?: number }): Promise<void>` - Assign popup HTML to button.
- `enable(tabId?: number): Promise<void>` - Enable button for a tab or globally.
- `disable(tabId?: number): Promise<void>` - Disable button for a tab or globally.

## Usage

```typescript
import { ActionPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class SyncStatusIndicatorService {
  constructor(private readonly action: ActionPort) {}

  async showSyncing(tabId: number) {
    await this.action.setBadgeText({ text: '...', tabId });
    await this.action.setBadgeBackgroundColor({ color: '#0078D4', tabId });
  }

  async showComplete(tabId: number) {
    await this.action.setBadgeText({ text: '?', tabId });
    await this.action.setBadgeBackgroundColor({ color: '#107C10', tabId });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <ActionPortAPI />
</ApiReferenceAppendix>
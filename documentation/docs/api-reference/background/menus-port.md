---
title: MenusPort
description: API reference for MenusPort in the background context.
---

import MenusPortAPI from '../../reference-models/ports/background/menus/menus-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# MenusPort

`MenusPort` creates and manages context menu items that appear when the user right-clicks on page content, links, or the extension icon.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/menus/menus.port.ts`

## Key Methods

- `create(createProperties: WebExtMenusCreateProperties): string | number` - Add a new context menu item.
- `update(id: string | number, updateProperties: Partial<WebExtMenusCreateProperties>): Promise<void>` - Modify an existing menu item.
- `remove(id: string | number): Promise<void>` - Remove a single menu item.
- `removeAll(): Promise<void>` - Remove all extension-created menu items.
- `onClickedAddListener(listener: (info: any, tab?: WebExtTab) => void): void` - Subscribe to menu item click events.
- `onClickedRemoveListener(listener: (info: any, tab?: WebExtTab) => void): void` - Unsubscribe from click events.

## Usage

```typescript
import { MenusPort } from '@hexajs/ports';
import { Injectable, InjectableContext } from '@hexajs/common';

@Injectable({ context: InjectableContext.Background })
export class ContextMenuService {
  constructor(private readonly menus: MenusPort) {}

  registerMenus() {
    this.menus.create({
      id: 'save-selection',
      title: 'Save to HexaClip',
      contexts: ['selection'],
    });
    this.menus.onClickedAddListener((info) => {
      if (info.menuItemId === 'save-selection') {
        this.handleSave(info.selectionText);
      }
    });
  }

  private handleSave(text?: string) {}
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <MenusPortAPI />
</ApiReferenceAppendix>
---
title: DevtoolsPort
description: API reference for DevtoolsPort in the UI context.
---

import DevtoolsPortAPI from '../../reference-models/ports/ui/devtools-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# DevtoolsPort

`DevtoolsPort` creates custom panels and sidebar panes within the browser's DevTools window, extending the developer tooling surface of an extension.

## Context

- **Availability:** UI
- **Source:** `packages/ports/src/ui/devtools/devtools.port.ts`

## Key Methods

- `panels.create(title: string, icon: string, page: string): Promise<WebExtExtensionPanel>` - Register a new DevTools panel tab.
- `panels.openResource(url: string, lineNumber: number): Promise<void>` - Open a source file at a specific line in the Sources panel.
- `panels.getThemeName(): 'default' | 'dark'` - Get the current DevTools color theme.
- `panels.elements.createSidebarPane(title: string): Promise<WebExtExtensionSidebarPane>` - Add a sidebar pane to the Elements panel.
- `panels.elements.onSelectionChanged(callback: () => void): void` - Subscribe to element selection changes.

## Usage

```typescript
import { DevtoolsPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.UI })
export class DevtoolsPanelService {
  constructor(private readonly devtools: DevtoolsPort) {}

  async registerPanel() {
    const panel = await this.devtools.panels.create(
      'HexaJS',
      'icons/icon-16.png',
      'devtools/panel.html',
    );
    panel.onShown.addListener((panelWindow) => {
      panelWindow.document.title = 'HexaJS DevTools';
    });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <DevtoolsPortAPI />
</ApiReferenceAppendix>
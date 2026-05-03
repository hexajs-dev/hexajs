---
title: ManagementPort
description: API reference for ManagementPort in the background context.
---

import ManagementPortAPI from '../../reference-models/ports/background/management/management-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# ManagementPort

`ManagementPort` introspects and controls the lifecycle of installed browser extensions, including enabling, disabling, and monitoring install events.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/management/management.port.ts`

## Key Methods

- `getAll(): Promise<WebExtManagementExtensionInfo[]>` - List all installed extensions.
- `getSelf(): Promise<WebExtManagementExtensionInfo>` - Get metadata about the current extension.
- `setEnabled(id: string, enabled: boolean): Promise<void>` - Enable or disable an extension by ID.
- `onInstalledAddListener(listener: (info: WebExtManagementExtensionInfo) => void): void` - Subscribe to extension install events.
- `onInstalledRemoveListener(listener: (info: WebExtManagementExtensionInfo) => void): void` - Unsubscribe from install events.
- `onUninstalledAddListener(listener: (id: string) => void): void` - Subscribe to extension uninstall events.
- `onUninstalledRemoveListener(listener: (id: string) => void): void` - Unsubscribe from uninstall events.

## Usage

```typescript
import { ManagementPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class ExtensionRegistryService {
  constructor(private readonly management: ManagementPort) {}

  async getEnabledExtensions(): Promise<string[]> {
    const all = await this.management.getAll();
    return all.filter((ext) => ext.enabled).map((ext) => ext.id);
  }

  async getSelfVersion(): Promise<string> {
    const self = await this.management.getSelf();
    return self.version;
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <ManagementPortAPI />
</ApiReferenceAppendix>
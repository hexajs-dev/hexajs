---
title: ExtensionPort
description: API reference for ExtensionPort in the general context.
---

import ExtensionPortAPI from '../../reference-models/ports/general/extension/extension-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# ExtensionPort

`ExtensionPort` exposes extension-level utilities for resolving resource URLs, querying active views, and checking incognito and file-scheme access.

## Context

- **Availability:** Universal
- **Source:** `packages/ports/src/general/extension/extension.port.ts`

## Key Methods

- `getURL(path?: string): string` - Resolve a path to a fully-qualified extension resource URL.
- `isAllowedIncognitoAccess(): Promise<boolean>` - Check if the extension can run in incognito windows.
- `isAllowedFileSchemeAccess(): Promise<boolean>` - Check if the extension can access `file://` URLs.
- `getViews(fetchProperties?: { type?: 'tab' | 'popup' | 'background'; windowId?: number }): Window[]` - Get active extension view windows.
- `getBackgroundPage(): Window | null` - Access the background page window (MV2 only).

## Usage

```typescript
import { ExtensionPort } from '@hexajs/ports';
import { Injectable, InjectableContext } from '@hexajs/common';

@Injectable({ context: InjectableContext.Background })
export class AssetResolverService {
  constructor(private readonly extension: ExtensionPort) {}

  getIconUrl(filename: string): string {
    return this.extension.getURL(`icons/${filename}`);
  }

  async canAccessIncognito(): Promise<boolean> {
    return this.extension.isAllowedIncognitoAccess();
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <ExtensionPortAPI />
</ApiReferenceAppendix>
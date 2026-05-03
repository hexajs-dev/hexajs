---
title: PermissionsPort
description: API reference for PermissionsPort in the background context.
---

import PermissionsPortAPI from '../../reference-models/ports/background/permissions/permissions-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# PermissionsPort

`PermissionsPort` manages optional permissions, allowing extensions to request, check, and revoke access at runtime in response to user actions.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/permissions/permissions.port.ts`

## Key Methods

- `contains(permissions: WebExtPermissions): Promise<boolean>` - Check whether the extension has specific permissions.
- `getAll(): Promise<WebExtPermissions>` - Get all currently granted permissions.
- `request(permissions: WebExtPermissions): Promise<boolean>` - Prompt the user to grant additional permissions.
- `remove(permissions: WebExtPermissions): Promise<boolean>` - Revoke previously granted permissions.
- `onAddedAddListener(listener: (permissions: WebExtPermissions) => void): void` - Subscribe to permission-granted events.
- `onAddedRemoveListener(listener: (permissions: WebExtPermissions) => void): void` - Unsubscribe from permission-granted events.
- `onRemovedAddListener(listener: (permissions: WebExtPermissions) => void): void` - Subscribe to permission-revoked events.
- `onRemovedRemoveListener(listener: (permissions: WebExtPermissions) => void): void` - Unsubscribe from permission-revoked events.

## Usage

```typescript
import { PermissionsPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class PermissionGateService {
  constructor(private readonly permissions: PermissionsPort) {}

  async ensureTabsPermission(): Promise<boolean> {
    const hasIt = await this.permissions.contains({ permissions: ['tabs'] });
    if (hasIt) return true;
    return this.permissions.request({ permissions: ['tabs'] });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <PermissionsPortAPI />
</ApiReferenceAppendix>
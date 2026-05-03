---
title: UserScriptsPort
description: API reference for UserScriptsPort in the background context.
---

import UserScriptsPortAPI from '../../reference-models/ports/background/user-scripts/user-scripts-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# UserScriptsPort

`UserScriptsPort` registers, updates, and removes user scripts that run in a dedicated isolated world, separate from both page context and extension content scripts.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/user-scripts/user-scripts.port.ts`

## Key Methods

- `register(scripts: WebExtUserScriptOptions[]): Promise<void>` - Register one or more user scripts.
- `unregister(filter?: { ids?: string[] }): Promise<void>` - Remove registered user scripts.
- `getScripts(filter?: { ids?: string[] }): Promise<WebExtUserScriptOptions[]>` - List currently registered scripts.
- `configureWorld(properties: { csp?: string; messaging?: boolean }): Promise<void>` - Configure the user script world's CSP and messaging capabilities.

## Usage

```typescript
import { UserScriptsPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class UserScriptManagerService {
  constructor(private readonly userScripts: UserScriptsPort) {}

  async injectForDomain(domain: string, scriptId: string) {
    await this.userScripts.register([{
      id: scriptId,
      matches: [`*://${domain}/*`],
      runAt: 'document_idle',
      world: 'ISOLATED',
    }]);
  }

  async removeScript(scriptId: string) {
    await this.userScripts.unregister({ ids: [scriptId] });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <UserScriptsPortAPI />
</ApiReferenceAppendix>
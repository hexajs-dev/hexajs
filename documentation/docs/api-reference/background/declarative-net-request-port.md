---
title: DeclarativeNetRequestPort
description: API reference for DeclarativeNetRequestPort in the background context.
---

import DeclarativeNetRequestPortAPI from '../../reference-models/ports/background/declarative-net-request/declarative-net-request-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# DeclarativeNetRequestPort

`DeclarativeNetRequestPort` manages dynamic network interception rules, allowing extensions to block, redirect, or modify requests without reading their content.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/declarative-net-request/declarative-net-request.port.ts`

## Key Methods

- `updateDynamicRules(options: WebExtDNRUpdateDynamicRulesOptions): Promise<void>` - Add or remove dynamic rules atomically.
- `getDynamicRules(): Promise<WebExtDNRRule[]>` - List all currently active dynamic rules.

## Usage

```typescript
import { DeclarativeNetRequestPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class AdBlockService {
  constructor(private readonly dnr: DeclarativeNetRequestPort) {}

  async blockDomain(domain: string, ruleId: number) {
    await this.dnr.updateDynamicRules({
      addRules: [{
        id: ruleId,
        priority: 1,
        action: { type: 'block' },
        condition: { urlFilter: domain, resourceTypes: ['main_frame', 'sub_frame'] },
      }],
    });
  }

  async unblockDomain(ruleId: number) {
    await this.dnr.updateDynamicRules({ removeRuleIds: [ruleId] });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <DeclarativeNetRequestPortAPI />
</ApiReferenceAppendix>
---
title: BrowsingDataPort
description: API reference for BrowsingDataPort in the background context.
---

import BrowsingDataPortAPI from '../../reference-models/ports/background/browsing-data/browsing-data-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# BrowsingDataPort

`BrowsingDataPort` clears user browsing data - including cache, cookies, and history - with fine-grained control over data types and time ranges.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/browsing-data/browsing-data.port.ts`

## Key Methods

- `remove(options: WebExtRemovalOptions, dataToRemove: WebExtDataTypeSet): Promise<void>` - Remove multiple data types in one call.
- `removeCache(options: WebExtRemovalOptions): Promise<void>` - Clear browser cache.
- `removeCookies(options: WebExtRemovalOptions): Promise<void>` - Clear cookies.
- `removeHistory(options: WebExtRemovalOptions): Promise<void>` - Clear browsing history.

## Usage

```typescript
import { BrowsingDataPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class PrivacyCleanupService {
  constructor(private readonly browsingData: BrowsingDataPort) {}

  async clearSessionData() {
    const since = Date.now() - 60 * 60 * 1000; // last hour
    await this.browsingData.remove(
      { since },
      { cache: true, cookies: true, history: true },
    );
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <BrowsingDataPortAPI />
</ApiReferenceAppendix>
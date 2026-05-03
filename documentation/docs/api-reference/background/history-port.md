---
title: HistoryPort
description: API reference for HistoryPort in the background context.
---

import HistoryPortAPI from '../../reference-models/ports/background/history/history-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# HistoryPort

`HistoryPort` searches and modifies the browser's visited-page history, enabling extensions to read, annotate, or selectively purge past navigation records.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/history/history.port.ts`

## Key Methods

- `search(query: WebExtHistorySearchQuery): Promise<WebExtHistoryItem[]>` - Search history by text or time range.
- `addUrl(details: { url: string; title?: string; transition?: string; visitTime?: number }): Promise<void>` - Add a URL to history.
- `deleteUrl(details: { url: string }): Promise<void>` - Remove all history entries for a URL.
- `deleteRange(range: { startTime: number; endTime: number }): Promise<void>` - Delete history within a time window.

## Usage

```typescript
import { HistoryPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Background })
export class HistoryAuditService {
  constructor(private readonly history: HistoryPort) {}

  async findRecentVisits(query: string): Promise<string[]> {
    const items = await this.history.search({
      text: query,
      startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
      maxResults: 50,
    });
    return items.map((item) => item.url ?? '');
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <HistoryPortAPI />
</ApiReferenceAppendix>
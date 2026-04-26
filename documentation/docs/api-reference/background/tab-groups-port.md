---
title: TabGroupsPort
description: API reference for TabGroupsPort in the background context.
---

import TabGroupsPortAPI from '../../reference-models/ports/background/tab-groups/tab-groups-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# TabGroupsPort

`TabGroupsPort` provides a unified, Promise-based interface for querying and managing the browser's tab grouping system.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/tab-groups/tab-groups.port.ts`

## Key Methods

- `query(queryInfo: TabGroupQueryInfo): Promise<WebExtTabGroup[]>` - Filter and list tab groups.
- `get(groupId: number): Promise<WebExtTabGroup>` - Retrieve a single tab group by ID.
- `update(groupId: number, updateProperties: Partial<WebExtTabGroup>): Promise<WebExtTabGroup>` - Modify a group's title, color, or collapsed state.
- `move(groupId: number, index: number): Promise<WebExtTabGroup>` - Reposition a group within its window.

## Usage

```typescript
import { TabGroupsPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class TabOrganizerService {
  constructor(private readonly tabGroups: TabGroupsPort) {}

  async collapseAll() {
    const groups = await this.tabGroups.query({});
    for (const group of groups) {
      await this.tabGroups.update(group.id, { collapsed: true });
    }
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <TabGroupsPortAPI />
</ApiReferenceAppendix>
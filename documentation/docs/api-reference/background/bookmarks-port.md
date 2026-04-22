---
title: BookmarksPort
description: API reference for BookmarksPort in the background context.
---

import BookmarksPortAPI from '../../reference-models/ports/background/bookmarks/bookmarks-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# BookmarksPort

`BookmarksPort` provides full CRUD access to the browser's bookmark tree, enabling extensions to read, create, reorganize, and delete bookmarks.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/bookmarks/bookmarks.port.ts`

## Key Methods

- `create(bookmark: WebExtBookmarkCreateArg): Promise<WebExtBookmarkTreeNode>` - Create a bookmark or folder.
- `get(idOrIdList: string | string[]): Promise<WebExtBookmarkTreeNode[]>` - Retrieve bookmarks by ID.
- `getTree(): Promise<WebExtBookmarkTreeNode[]>` - Retrieve the full bookmark tree.
- `search(query: string | { query?: string; title?: string; url?: string }): Promise<WebExtBookmarkTreeNode[]>` - Search bookmarks by text or properties.
- `update(id: string, changes: WebExtBookmarkChanges): Promise<WebExtBookmarkTreeNode>` - Update a bookmark's title or URL.
- `move(id: string, destination: WebExtBookmarkMoveDestination): Promise<WebExtBookmarkTreeNode>` - Move a bookmark to a new parent or index.
- `remove(id: string): Promise<void>` - Remove a single bookmark.
- `removeTree(id: string): Promise<void>` - Remove a folder and all its contents.

## Usage

```typescript
import { BookmarksPort } from '@hexajs/ports';
import { Injectable, InjectableContext } from '@hexajs/common';

@Injectable({ context: InjectableContext.Background })
export class BookmarkOrganizerService {
  constructor(private readonly bookmarks: BookmarksPort) {}

  async archiveByDomain(domain: string, archiveFolderId: string) {
    const results = await this.bookmarks.search({ query: domain });
    for (const bookmark of results) {
      await this.bookmarks.move(bookmark.id, { parentId: archiveFolderId });
    }
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <BookmarksPortAPI />
</ApiReferenceAppendix>
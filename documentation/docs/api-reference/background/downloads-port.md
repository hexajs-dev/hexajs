---
title: DownloadsPort
description: API reference for DownloadsPort in the background context.
---

import DownloadsPortAPI from '../../reference-models/ports/background/downloads/downloads-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# DownloadsPort

`DownloadsPort` initiates, monitors, and manages file downloads, giving extensions full control over the browser's download queue.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/downloads/downloads.port.ts`

## Key Methods

- `download(options: WebExtDownloadsDownloadOptions): Promise<number>` - Start a download, returns the download ID.
- `search(query: WebExtDownloadsQuery): Promise<WebExtDownloadItem[]>` - Query download history.
- `erase(query: WebExtDownloadsQuery): Promise<number[]>` - Remove download records matching a query.
- `pause(downloadId: number): Promise<void>` - Pause an in-progress download.
- `resume(downloadId: number): Promise<void>` - Resume a paused download.
- `cancel(downloadId: number): Promise<void>` - Cancel an in-progress download.
- `show(downloadId: number): Promise<void>` - Reveal the downloaded file in the OS file manager.
- `open(downloadId: number): Promise<void>` - Open the downloaded file.

## Usage

```typescript
import { DownloadsPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class ReportExportService {
  constructor(private readonly downloads: DownloadsPort) {}

  async exportReport(url: string, filename: string): Promise<number> {
    const downloadId = await this.downloads.download({
      url,
      filename,
      conflictAction: 'uniquify',
    });
    return downloadId;
  }

  async clearCompletedDownloads() {
    await this.downloads.erase({ state: 'complete' });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <DownloadsPortAPI />
</ApiReferenceAppendix>
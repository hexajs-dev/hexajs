---
title: Downloads Port (ports)
description: Public API model reference for ports module packages/ports/src/background/downloads/downloads.port.ts.
---


### Classes

#### DownloadsPort

```ts
import { DownloadsPort } from '@hexajs/ports';
```

```typescript
class DownloadsPort { ... }
```

#### Methods

**`cancel()`**
```typescript
cancel(downloadId: number): Promise<void>
```

**`download()`**
```typescript
download(options: HexaWebDownloadsDownloadOptions): Promise<number>
```

**`erase()`**
```typescript
erase(query: HexaWebDownloadsQuery): Promise<number[]>
```

**`onChangedAddListener()`**
```typescript
onChangedAddListener(listener: (delta: any) => void): void
```

**`onChangedRemoveListener()`**
```typescript
onChangedRemoveListener(listener: (delta: any) => void): void
```

**`open()`**
```typescript
open(downloadId: number): Promise<void>
```

**`pause()`**
```typescript
pause(downloadId: number): Promise<void>
```

**`resume()`**
```typescript
resume(downloadId: number): Promise<void>
```

**`search()`**
```typescript
search(query: HexaWebDownloadsQuery): Promise<HexaWebDownloadItem[]>
```

**`show()`**
```typescript
show(downloadId: number): Promise<void>
```


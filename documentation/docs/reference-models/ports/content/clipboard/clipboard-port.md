---
title: Clipboard Port (ports)
description: Public API model reference for ports module packages/ports/src/content/clipboard/clipboard.port.ts.
---


### Classes

#### ClipboardPort

```ts
import { ClipboardPort } from '@hexajs-dev/ports';
```

```typescript
class ClipboardPort { ... }
```

#### Methods

**`writeText()`**
```typescript
writeText(text: string): Promise<void>
```

**`readText()`**
```typescript
readText(): Promise<string>
```
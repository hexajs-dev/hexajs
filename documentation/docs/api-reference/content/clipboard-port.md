---
title: ClipboardPort
description: API reference for ClipboardPort in the content context.
---

import ClipboardPortAPI from '../../reference-models/ports/content/clipboard/clipboard-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# ClipboardPort

`ClipboardPort` provides content-script clipboard access over the browser's `navigator.clipboard` API. When injected, the CLI automatically adds `clipboardRead` and `clipboardWrite` to the generated manifest.

## Context

- **Availability:** Content only
- **Source:** `packages/ports/src/content/clipboard/clipboard.port.ts`

## Key Methods

- `writeText(text: string): Promise<void>` - Write a string to the system clipboard.
- `readText(): Promise<string>` - Read the current string value from the system clipboard.

`writeText` automatically falls back to `document.execCommand('copy')` when `navigator.clipboard.writeText` is restricted by browser runtime policy.

## Usage

```typescript
import { ClipboardPort } from '@hexajs-dev/ports';
import { Injectable, HexaContext } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.Content })
export class CopyHandler {
  constructor(private readonly clipboard: ClipboardPort) {}

  async copyToClipboard(text: string) {
    await this.clipboard.writeText(text);
  }

  async pasteFromClipboard(): Promise<string> {
    return this.clipboard.readText();
  }
}
```

## Manifest Permissions

Using `ClipboardPort` in the DI graph causes the CLI to automatically include the following permissions in the generated manifest for every target browser:

| Permission | Purpose |
|---|---|
| `clipboardRead` | Required by `readText()` |
| `clipboardWrite` | Required by `writeText()` |

No manual manifest configuration is needed.

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <ClipboardPortAPI />
</ApiReferenceAppendix>

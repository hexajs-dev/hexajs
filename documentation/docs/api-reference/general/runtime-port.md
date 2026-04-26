---
title: RuntimePort
description: API reference for RuntimePort in the general context.
---

import RuntimePortAPI from '../../reference-models/ports/general/runtime/runtime-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# RuntimePort

`RuntimePort` is the universal message bus for the extension runtime, enabling cross-context messaging, lifecycle hooks, and extension reload.

## Context

- **Availability:** Universal
- **Source:** `packages/ports/src/general/runtime/runtime.port.ts`

## Key Methods

- `sendMessage(message: any): Promise<any>` - Send a message to the extension's background listener and await a response.
- `onMessage(callback: (message: any, sender: webExt.runtime.MessageSender, sendResponse: (response?: any) => void) => void): () => void` - Register a message listener, returns an unsubscribe function.
- `onSuspend(callback: () => void): void` - Register a callback for service worker suspension.
- `reload(): void` - Reload the entire extension.

## Usage

```typescript
import { RuntimePort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class MessageRouterService {
  constructor(private readonly runtime: RuntimePort) {}

  initialize() {
    const unsubscribe = this.runtime.onMessage((message, sender) => {
      if (message.type === 'FETCH_CONFIG') {
        return { config: this.getConfig() };
      }
    });
    this.runtime.onSuspend(unsubscribe);
  }

  private getConfig() {}
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <RuntimePortAPI />
</ApiReferenceAppendix>
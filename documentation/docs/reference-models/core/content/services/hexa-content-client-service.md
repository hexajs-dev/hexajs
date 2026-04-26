---
title: Hexa Content Client Service (core)
description: Public API model reference for core module packages/core/src/content/services/hexa-content-client.service.ts.
---


### Classes

#### HexaContentClient

Content-context HexaClient.
Sends messages from the content script to the background.

```ts
import { HexaContentClient } from '@hexajs-dev/core';
```

```typescript
class HexaContentClient { ... }
```

#### Methods

**`sendMessage()`**
> Send a message and await a response.
Content → background uses runtime.sendMessage.
Background → content requires a tabId — use BackgroundHexaClient.sendToTab().
```typescript
sendMessage<TPayload, TResponse>(target: `${namespace}:${api}`, payload?: TPayload): Promise<TResponse>
```


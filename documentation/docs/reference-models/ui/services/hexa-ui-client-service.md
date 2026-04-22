---
title: Hexa Ui Client Service (ui)
description: Public API model reference for ui module packages/ui/src/services/hexa-ui-client.service.ts.
---


### Classes

#### HexaUIClient

UI-context HexaClient.
Sends messages from popup/devtools UI to the background.

```ts
import { HexaUIClient } from '@hexajs/ui';
```

```typescript
class HexaUIClient { ... }
```

#### Methods

**`sendMessage()`**
> Send a message and await a response.
Content → background uses runtime.sendMessage.
Background → content requires a tabId — use BackgroundHexaClient.sendToTab().
```typescript
sendMessage<TPayload, TResponse>(target: `${namespace}:${api}`, payload?: TPayload): Promise<TResponse>
```


---
title: Hexa Background Client Service (core)
description: Public API model reference for core module packages/core/src/background/services/hexa-background-client.service.ts.
---


### Classes

#### HexaBackgroundClient

Background-context HexaClient.
Extends the base with tab-targeted messaging and broadcast.

```ts
import { HexaBackgroundClient } from '@hexajs-dev/core';
```

```typescript
class HexaBackgroundClient { ... }
```

#### Methods

**`broadcast()`**
> Broadcast a fire-and-forget message to all tabs.
```typescript
broadcast<TPayload>(target: `${namespace}:${api}`, payload?: TPayload): Promise<void>
```

**`sendMessage()`**
> Send a message and await a response.
Content → background uses runtime.sendMessage.
Background → content requires a tabId — use BackgroundHexaClient.sendToTab().
```typescript
sendMessage<TPayload, TResponse>(target: `${namespace}:${api}`, payload?: TPayload): Promise<TResponse>
```

**`sendToTab()`**
> Send a message to a specific tab and await a response.
```typescript
sendToTab<TPayload, TResponse>(tabId: number, target: `${namespace}:${api}`, payload?: TPayload): Promise<TResponse>
```


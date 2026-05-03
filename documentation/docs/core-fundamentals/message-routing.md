---
title: Message Routing
sidebar_position: 6
description: Route typed namespace-based messages between UI, content, and background using controllers and clients.
---

import ControllerDecoratorsAPI from '../reference-models/core/background/controller/decorators.md';
import HandlerDecoratorsAPI from '../reference-models/core/content/handler/decorators.md';
import HexaBackgroundClientAPI from '../reference-models/core/background/services/hexa-background-client-service.md';
import HexaContentClientAPI from '../reference-models/core/content/services/hexa-content-client-service.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Message Routing

Messages travel between isolated contexts (UI, content, background) using **typed routes** in the form `namespace:action`. Controllers define the routes; clients send the messages.

## Security boundary defaults

Routes are **internal-only by default**.

- Internal sender calls continue to work without extra configuration.
- Background external listeners are resolved at CLI build time.
- External callers must be explicitly allowed with `@AllowExternal()`.
- Method decorators override class decorators.

For background routes, both `@Action` (unicast) and `@On` (multicast) can be externally exposed with method-level `@AllowExternal()`.

Use boundary decorators from `@hexajs-dev/common`:

```ts
import { AllowExternal, InternalOnly } from '@hexajs-dev/common';
import { Action, Controller } from '@hexajs-dev/core';

@AllowExternal({
  ids: ['trusted.extension.id'],
  origins: ['https://partner.example.com'],
})
@Controller({ namespace: 'integration' })
export class IntegrationController {
  @Action('public')
  onPublic(payload: unknown): { ok: true } {
    return { ok: true };
  }

  @InternalOnly()
  @Action('admin')
  onAdmin(payload: unknown): { ok: true } {
    return { ok: true };
  }
}
```

Method-level `@AllowExternal()` is also supported. This is useful when most routes stay internal-only and only specific routes are exposed:

```ts
import { AllowExternal, InternalOnly } from '@hexajs-dev/common';
import { Action, Controller } from '@hexajs-dev/core';

@InternalOnly()
@Controller({ namespace: 'integration' })
export class IntegrationController {
  @Action('public')
  onPublic(payload: unknown): { ok: true } {
    return { ok: true };
  }

  @AllowExternal()
  @Action('admin')
  onAdmin(payload: unknown): { ok: true } {
    return { ok: true };
  }
}
```

External behavior in background is channel-aware:

- Routes without `@AllowExternal()` are not externally subscribed and are ignored on `runtime.onMessageExternal`.
- Externally subscribed unicast routes return `__hexa_code__ = 'HEXA_BOUNDARY_POLICY_DENIED'` when `ids`/`origins` checks fail.
- Externally subscribed multicast routes are dropped and logged when `ids`/`origins` checks fail.
- Content scripts still use internal runtime messaging only. Browser runtime external listeners are background-only.

## Message flow fundamentals

### Request/Response pattern

```text
Sender (UI / Content / Background)
  -> client.sendMessage('namespace:action', payload)
  -> ControllerContainer resolves → @Controller + @Action
  -> Handler executes, returns result
  -> Promise resolves with response
```

All routes are **typed and validated** at build time (AOT scanning).

ClipVault keeps route names in a shared API file so UI, content, and background all use the same constants:

```ts
export const configApi = {
  Get: 'config:get',
  Update: 'config:update',
} as const;

export const clipboardApi = {
  Add: 'clipboard:add',
  Get: 'clipboard:get',
  Remove: 'clipboard:remove',
} as const;

export const clipboardHandlesApi = {
  SyncClips: 'clipboard:sync-clips',
  SyncConfig: 'clipboard:sync-config',
} as const;
```

## Tutorial: Three message flows

### Scenario 1: UI sends to background

**Popup snippet**:

```ts
import { inject } from '@hexajs-dev/common';
import { HexaUIClient } from '@hexajs-dev/ui';
import { configApi } from './api';
import { ConfigResponseMessage, GetConfigMessage } from './messages';

const hexaUIClient = inject(HexaUIClient);
const response = await hexaUIClient.sendMessage<GetConfigMessage, ConfigResponseMessage>(
  configApi.Get,
  new GetConfigMessage(Date.now())
);
```

**Background Controller**:

```ts
@Controller({ namespace: configNamespace })
export class ClipVaultConfigController {
  @Action(ConfigActionsApi.Get)
  async onGetConfig(_payload: GetConfigMessage): Promise<ConfigResponseMessage> {
    const config = await this.configService.loadConfig();
    return new ConfigResponseMessage(config);
  }
}
```

**Message flow**:
```
Popup calls hexaUIClient.sendMessage(configApi.Get, new GetConfigMessage(...))
  → Browser extension sends the request to background
  → Background ControllerContainer receives message
  → Resolves config:get → calls onGetConfig(payload)
  → Returns ConfigResponseMessage
  → Popup receives the config payload
```

---

### Scenario 2: Content script sends to background

**Content snippet**:

```ts
const clip = this.captureService.captureFromCopyEvent(event);

if (clip) {
  this.client.sendMessage<AddClipMessage, ClipsResponseMessage>(
    clipboardApi.Add,
    new AddClipMessage(clip)
  ).catch(err => this.logger.error('Failed to send clip to background:', err));
}
```

**Background controller**:

```ts
@Controller({ namespace: clipboardNamespace })
export class ClipVaultClipboardController {
  @Action(ClipboardActionsApi.Add)
  async onAddClip(payload: AddClipMessage): Promise<ClipsResponseMessage> {
    let clips = await this.clipboardManager.loadClips();
    clips = this.clipboardManager.addClip(clips, payload.clip, config.storage.maxItems);
    await this.clipboardManager.persistClips(clips);
    return new ClipsResponseMessage(clips);
  }
}
```

**Message flow**:
```
Content calls this.client.sendMessage(clipboardApi.Add, new AddClipMessage(clip))
  → Browser extension message API routes to background
  → Background ControllerContainer receives
  → Resolves clipboard:add → calls onAddClip(payload)
  → Background persists the updated clip list
  → Returns ClipsResponseMessage
  → Content can continue with the synchronized result
```

---

### Scenario 3: Background broadcasts to content handlers

ClipVault uses background broadcasts to keep content scripts synchronized after config or clip changes.

**Background controller**:

```ts
@Action(ConfigActionsApi.Update)
async onUpdateConfig(payload: UpdateConfigMessage): Promise<ConfigResponseMessage> {
  const merged = this.configService.mergeConfig(current, payload.config);
  const syncMessage = new SyncConfigMessage(merged);

  this.client.broadcast(clipboardHandlesApi.SyncConfig, syncMessage)
    .catch(err => this.logger.error('Broadcast config failed:', err));

  return new ConfigResponseMessage(merged);
}
```

**Content handler**:

```ts
@Handler({ namespace: clipboardHandlesNamespace, Contents: [ClipVaultContent] })
export class ClipVaultHandler {
  @Handle(ClipboardHandlesApi.SyncConfig)
  onSyncConfig(payload: SyncConfigMessage): { status: string } {
    this.store.dispatch(configSynced({ config: payload.config }));
    return { status: 'received' };
  }
}
```

**Message flow**:
```
Background calls this.client.broadcast(clipboardHandlesApi.SyncConfig, syncMessage)
  → Browser extension routes the message to matching content scripts
  → Content HandlerContainer receives the message
  → Resolves clipboard:sync-config → calls onSyncConfig(payload)
  → Content updates local state and acknowledges with { status: 'received' }
```

---

## Message structure

### Payload types

All payloads are **serializable** (JSON.stringify must work):

```ts
// ✅ Good
{
  timestamp: 1234567890,
  url: 'https://example.com',
  tags: ['important', 'urgent'],
  metadata: { key: 'value' }
}

// ❌ Bad
{
  element: document.getElementById('main'),  // DOM node
  func: () => { ... },                         // Function
  circular: { ref: self }                      // Circular reference
}
```

### Response types

Controllers return values that are automatically serialized:

```ts
@Action('query')
onQuery(payload: any): { status: string; results: any[] } {
  // HexaJS auto-serializes this object
  return {
    status: 'success',
    results: [...],
  };
}
```

## Error handling

If a controller throws, the client promise rejects:

```ts
// Background controller
@Action('risky')
onRiskyAction(payload: any) {
  if (!payload.required_field) {
    throw new Error('Missing required_field'); // ← Sent to caller
  }
  return { success: true };
}

// UI code
try {
  await uiClient.sendMessage('namespace:risky', {});
} catch (error) {
  console.error('Controller threw:', error.message); // "Missing required_field"
}
```

## Best practices

✅ **Do:**
- Keep action names descriptive: `popup:opened`, `visibility:show`, `storage:read`
- Validate payload in @Action handlers before processing
- Use store + reducers for state changes (not just return values)
- Namespace controllers logically (`popup`, `content`, `tabs`, `storage`)
- Return lightweight, serializable responses

❌ **Don't:**
- Rely on message order if sending multiple async messages
- Pass large objects (serialize first if needed)
- Embed business logic in message creation; keep it in controllers
- Mix messaging routes with internal service calls (clients are for cross-context only)

<ApiReferenceAppendix>
<HexaBackgroundClientAPI />

<HexaContentClientAPI />
</ApiReferenceAppendix>
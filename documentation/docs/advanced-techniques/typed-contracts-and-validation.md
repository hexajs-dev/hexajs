---
title: Typed Contracts and Validation
sidebar_position: 5
description: Design validated DTO contracts for controller actions, broadcast handles, and devtools messages. Use AOT-generated route validators to reject malformed payloads before business logic runs.
---

# Typed Contracts and Validation

> **Target Audience:** Advanced
> **Goal:** Design a contract layer that is validated at every boundary — controller actions, broadcast handles, content handlers, and devtools messages — using HexaJS AOT-generated validators.

As an extension grows, the most common source of runtime errors is mismatched payload shape between contexts. Callers use one DTO version, receivers expect another. The browser extension runtime gives you no type safety across the message bus.

HexaJS addresses this with AOT-generated route validators. During build, the CLI scans DTO classes decorated with `@IsString`, `@IsNumber`, `@IsOptional`, etc. and generates per-route validation code. Invalid payloads are rejected before your business logic runs.

This recipe draws from both **smart-clipper** and **clip-volt** ([github.com/hexajs-dev/examples](https://github.com/hexajs-dev/examples)).

## The contract layer pattern

Group all cross-context messages into a `src/contract/` folder. This makes the boundaries visible and prevents DTO definitions from drifting into context-specific code where they become hard to find and easy to diverge.

A typical contract layout:

```
src/
└── contract/
    ├── api.ts          ← route constants (namespace + action keys)
    ├── messages.ts     ← all DTO classes
    └── config.ts       ← shared config/schema types
```

## Route constants: type-safe routing keys

Define routing constants as string enums or const objects. This prevents stringly-typed route strings from scattering across controllers and handlers.

```ts
// src/contract/api.ts

// Namespace constants
export const clipboardNamespace = 'clipboard';
export const configNamespace    = 'config';
export const ocrNamespace       = 'ocr';

// Per-namespace action keys
export const ClipboardActionsApi = {
  Add:    'add',
  Get:    'get',
  Remove: 'remove',
} as const;

export const clipboardHandlesApi = {
  SyncClips:  `${clipboardNamespace}:sync-clips`,
  SyncConfig: `${configNamespace}:sync-config`,
} as const;
```

Combine them into the `target` format expected by `HexaBackgroundClient.broadcast`:

```ts
this.client.broadcast(clipboardHandlesApi.SyncClips, new SyncClipsMessage(clips));
// resolves to: 'clipboard:sync-clips'
```

## Validated DTOs

Decorate every field that crosses a message boundary. The build scanner uses these decorators to generate validators.

```ts
// src/contract/messages.ts
import { IsNumber, IsOptional, IsString } from '@hexajs-dev/common';

// Request DTO — sent from content to background
export class AddClipMessage {
  @IsString()
  id: string;

  @IsString()
  text: string;

  @IsString()
  sourceDomain: string;

  @IsString()
  sourceUrl: string;

  @IsNumber()
  capturedAt: number;

  @IsOptional()
  @IsString()
  ocrLanguage?: string;

  constructor(clip: ClipItem) {
    Object.assign(this, clip);
  }
}

// Response DTO — returned by the controller action
export class ClipsResponseMessage {
  clips: ClipItem[];
  constructor(clips: ClipItem[]) {
    this.clips = clips;
  }
}

// Broadcast DTO — pushed from background to all tabs
export class SyncClipsMessage {
  clips: ClipItem[];
  constructor(clips: ClipItem[]) {
    this.clips = clips;
  }
}
```

**Decoration rules:**
- Use `@IsString()` for string fields.
- Use `@IsNumber()` for numeric fields.
- Use `@IsOptional()` before the type decorator for nullable or omittable fields.
- Fields without a decorator are not validated — intentional for complex nested types that you validate separately.

## Controller: typed action handler

```ts
// src/background/controller.ts
import { Controller, Action } from '@hexajs-dev/core';
import { clipboardNamespace, ClipboardActionsApi } from '../contract/api';
import { AddClipMessage, ClipsResponseMessage } from '../contract/messages';

@Controller({ namespace: clipboardNamespace })
export class ClipboardController {
  @Action(ClipboardActionsApi.Add)
  async onAddClip(payload: AddClipMessage): Promise<ClipsResponseMessage> {
    // AOT-generated validator runs before this method executes.
    // If payload shape is wrong, the framework rejects it with a validation error.
    const clips = await this.clipboardManager.addClip(payload);
    return new ClipsResponseMessage(clips);
  }
}
```

The AOT pipeline maps the `namespace:action` route to the generated validator for `AddClipMessage`. You never write the validator by hand.

## Content handler: validated broadcast receiver

Handler methods receive broadcasts. They are validated the same way:

```ts
// src/content/handler.ts
import { Handler, Handle } from '@hexajs-dev/core';
import { clipboardNamespace } from '../contract/api';
import { SyncClipsMessage } from '../contract/messages';
import { MyContent } from './content';

@Handler({ namespace: clipboardNamespace, Contents: [MyContent] })
export class ClipboardHandler {
  @Handle('sync-clips')
  onSyncClips(payload: SyncClipsMessage): void {
    this.store.dispatch(clipsSynced({ clips: payload.clips }));
  }
}
```

## Diagnostic message sets

For DevTools surfaces, validation also protects the channel between background and the DevTools panel. smart-clipper uses a separate message set for diagnostic/telemetry data:

```ts
// Diagnostic clip with optional timing fields
export class DevtoolsClipDiagnosticItem {
  @IsNumber()
  capturedAt: number;

  @IsString()
  textPreview: string;

  @IsString()
  fullText: string;

  @IsOptional() @IsNumber() confidence?: number;
  @IsOptional() @IsString() ocrLanguage?: string;
  @IsOptional() @IsNumber() sourceTabId?: number;
  @IsOptional() @IsString() sourceTabTitle?: string;
  @IsOptional() @IsString() sourceTabUrl?: string;

  // Timing telemetry — all optional so partial records are valid
  @IsOptional() @IsNumber() captureDurationMs?: number;
  @IsOptional() @IsNumber() ocrDurationMs?: number;
  @IsOptional() @IsNumber() totalDurationMs?: number;
}

export class DevtoolsStateMessage {
  clips: DevtoolsClipDiagnosticItem[];
  errors: DevtoolsErrorItem[];
  constructor(clips: DevtoolsClipDiagnosticItem[], errors: DevtoolsErrorItem[]) {
    this.clips = clips;
    this.errors = errors;
  }
}
```

Timing fields are all `@IsOptional()` so the message is valid even if a capture failed partway through. The DevTools UI renders what is present and shows dashes for missing durations.

## Validation failure behavior

When an inbound payload fails validation, HexaJS:
1. Rejects the message before calling the action or handle method.
2. Returns an error response with a `__hexa_error__` marker and validation failure details.
3. Does not invoke business logic.

Check for validation errors in callers that need to distinguish a validation failure from a business logic failure:

```ts
const response = await this.client.sendMessage<AddClipMessage, ClipsResponseMessage>(
  `${clipboardNamespace}:${ClipboardActionsApi.Add}`,
  new AddClipMessage(clip),
);

if ((response as any).__hexa_error__) {
  console.warn('Validation or routing error:', response);
  return;
}

this.store.dispatch(clipsSynced({ clips: response.clips }));
```

## Keeping contracts stable as extensions grow

Three practices that prevent contract drift at scale:

**1. Version in the action key if you break a contract.** Callers that have not updated yet will get a routing miss rather than a silent data mismatch:

```ts
export const ClipboardActionsApi = {
  AddV2: 'add.v2',
} as const;
```

**2. Use `@IsOptional()` for new fields added to existing DTOs.** Old senders that omit the new field will still pass validation.

**3. Keep request/response/broadcast DTOs separate even when they look similar.** A `ClipsResponseMessage` and a `SyncClipsMessage` both carry a `clips` array, but their validation routes are different, and they may diverge over time.

## Related reading

- [Validation Pipes](../core-fundamentals/validation-pipes.md)
- [Message Routing](../core-fundamentals/message-routing.md)
- [Controllers & Actions](../core-fundamentals/controllers.md)
- [Handlers & Handle](../core-fundamentals/handlers.md)
- [Build Pipeline](../cli-tooling/build-pipeline.md) — how route validators are generated

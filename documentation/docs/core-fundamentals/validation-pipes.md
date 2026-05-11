---
title: Validation Pipes
sidebar_position: 7
description: Validate message payloads and responses with AOT-generated pipes wired into background and content routing.
---

import ValidationDecoratorsAPI from '../reference-models/common/validation/decorators.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Validation Pipes

HexaJS can validate routed message payloads and responses without a runtime validation library. You define DTO classes with validation decorators, the CLI scans them during build, and the generated bootstrap registers **validation pipes** for background and content messaging.

## What validation pipes do

Validation pipes run in two places for each routed message:

- **Inbound validation:** Validates the payload before the controller or handler method runs.
- **Outbound validation:** Validates the returned value before it is sent back to the caller.

This gives you route-aware validation for `@Action(...)` and `@Handle(...)` methods with no manual validator registration.

## DTO example

ClipVault uses DTO classes in `src/contract/messages.ts` to define route contracts. Keep these classes small, serializable, and explicit about the fields that must be validated.

```ts
import { IsBoolean, IsNumber, IsOptional, IsString } from '@hexajs-dev/common';

export class GetConfigMessage {
  @IsNumber() requestedAt: number;

  constructor(requestedAt: number) {
    this.requestedAt = requestedAt;
  }
}

export class RemoveClipMessage {
  @IsString() clipId: string;

  constructor(clipId: string) {
    this.clipId = clipId;
  }
}

export class ClipItem {
  @IsString() id: string;
  @IsString() text: string;
  @IsString() sourceUrl: string;
  @IsString() sourceDomain: string;
  @IsString() sourceElement: string;
  @IsNumber() capturedAt: number;
  @IsBoolean() sensitive: boolean;
}

export class GetClipsMessage {
  @IsNumber() requestedAt: number;
  @IsOptional() @IsString() domain?: string;
}
```

These decorators are **metadata-only**. They do not validate by themselves at runtime. Their job is to give the CLI enough information to generate validators ahead of time.

## Route example

### Content sends a validated request

```ts
const configResponse = await this.client.sendMessage<GetConfigMessage, ConfigResponseMessage>(
  configApi.Get,
  new GetConfigMessage(Date.now())
);
```

### Background receives the payload and returns a validated response

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

ClipVault also validates other routes such as `clipboard:remove`:

```ts
@Action(ClipboardActionsApi.Remove)
async onRemoveClip(payload: RemoveClipMessage): Promise<ClipsResponseMessage> {
  const clips = this.clipboardManager.removeClip(existingClips, payload.clipId);
  return new ClipsResponseMessage(clips);
}
```

In these routes:

- `GetConfigMessage` is the **inbound** DTO for `config:get`.
- `ConfigResponseMessage` is the **outbound** DTO for `config:get`.
- `RemoveClipMessage` is the **inbound** DTO for `clipboard:remove`.
- `ClipsResponseMessage` is the **outbound** DTO for `clipboard:remove`.

## How the pipeline works

### 1. Decorator scanning

During build, the CLI scans DTO classes and stores property-level validation metadata. It only generates validators for DTOs that are actually referenced by routed controller or handler methods.

DTO classes without supported validation decorators are ignored, so validation is never forced for undecorated route contracts.

### 2. Route to DTO mapping

For each route, the scanner extracts:

- The **first method parameter type** as the inbound DTO.
- The **return type** or `Promise<T>` type as the outbound DTO.

For example:

```ts
@Action(ConfigActionsApi.Get)
onGetConfig(payload: GetConfigMessage): ConfigResponseMessage {
  return new ConfigResponseMessage(config);
}
```

This maps:

- `config:get` inbound payload -> `GetConfigMessage`
- `config:get` outbound response -> `ConfigResponseMessage`

### 3. Validator generation

The build emits context-specific validator modules:

- `background.validators.js`
- `content.validators.js`

Each file contains:

- Generated validator functions for each used DTO
- A route map for inbound payload validation
- A route map for outbound response validation
- Factory functions: `createAotValidationPipe()` and `createAotOutboundValidationPipe()`

The generated route map looks like this:

```ts
const routeValidators = {
  'config:get': validateGetConfigMessage,
  'clipboard:remove': validateRemoveClipMessage,
};

const routeResponseValidators = {
  'config:get': validateResponseConfigResponseMessage,
  'clipboard:remove': validateResponseClipsResponseMessage,
};
```

### 4. Bootstrap registration

The generated background and content bootstraps automatically wire the pipes into dedicated pipe runners used by the container:

```ts
const pipeRunner = new HexaPipeRunner();
pipeRunner.usePipe(createAotValidationPipe());
pipeRunner.useOutboundPipe(createAotOutboundValidationPipe());
controllerContainer.setPipeRunner(pipeRunner);
```

Content uses the same pattern with `HandlerContainer`.

### 5. Runtime execution order

For a unicast route, the runtime flow is:

```text
Incoming message
  -> run inbound validation pipe
  -> invoke @Action / @Handle method
  -> run outbound validation pipe
  -> send response back to caller
```

If inbound validation fails, your controller or handler method is **not** executed.

## Supported decorator checks

The current generated validator logic enforces these common checks:

- `@IsDefined()`
- `@IsOptional()`
- `@IsNotEmpty()`
- `@IsString()`
- `@IsBoolean()`
- `@IsNumber()`
- `@IsInt()`
- `@IsArray()`
- `@Min(...)`
- `@Max(...)`
- `@MinLength(...)`
- `@MaxLength(...)`
- `@Length(min, max)`
- `@Matches(...)`
- `@IsEmail()`

Other decorators may exist as metadata markers in `@hexajs-dev/common`, but the generated validator currently enforces the subset above.

## Response validation behavior

Outbound validation is strict for object DTOs.

If a response DTO does **not** declare an index signature, the generated validator also rejects unknown properties:

```ts
function validateResponseClipsResponseMessage(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'ClipsResponseMessage response must be an object' };
  }

  const allowedKeys = new Set(['clips']);
  const extraKeys = Object.keys(data).filter(key => !allowedKeys.has(key));
  if (extraKeys.length > 0) {
    return {
      valid: false,
      error: 'ClipsResponseMessage response has unknown properties',
      details: { extraKeys },
    };
  }

  return { valid: true };
}
```

That means response DTOs are useful not just for request validation, but also for keeping controller and handler outputs stable over time.

## Failure behavior

Inside the pipe system, validation failures become `HexaPipeValidationError`. The container catches that error and serializes it into a structured message payload.

The transport-level failure shape remains:

```ts
{
  __hexa_error__: 'message must be a string',
  __hexa_code__: 'HEXA_VALIDATION_FAILED',
  __hexa_details__: undefined,
}
```

For outbound failures, the code is typically:

```ts
'HEXA_RESPONSE_VALIDATION_FAILED'
```

`sendMessage(...)` and `sendToTab(...)` now reject their promise when the response payload has a validation code:

- `HEXA_VALIDATION_FAILED`
- `HEXA_RESPONSE_VALIDATION_FAILED`

The client maps the internal transport payload to `HexaRemoteError`, so your catch blocks use standard error fields:

- `error.message`
- `error.code`
- `error.details`

Other structured Hexa payloads (for example `HEXA_BOUNDARY_POLICY_DENIED`) are still returned as resolved responses.

`Promise.catch(...)` example:

```ts
import { HexaRemoteError } from '@hexajs-dev/core';

contentClient
  .sendMessage(configApi.Get, { requestedAt: 'not-a-number' })
  .catch((error: unknown) => {
    if (error instanceof HexaRemoteError) {
      console.error(error.code, error.message, error.details);
      return;
    }

    throw error;
  });
```

`async/await` example:

```ts
import { HexaRemoteError } from '@hexajs-dev/core';

try {
  await contentClient.sendMessage(configApi.Get, { requestedAt: 'not-a-number' });
} catch (error: unknown) {
  if (error instanceof HexaRemoteError) {
    console.error(error.code, error.message, error.details);
  }
}
```

## Best practices

- Use DTO classes for any route whose payload shape matters.
- Return DTO classes from `@Action(...)` and `@Handle(...)` when response shape matters too.
- Keep DTOs small and serializable.
- Prefer explicit DTOs over anonymous object types if you want generated validation.
- Treat response DTOs as part of the route contract, not just a convenience.
- Use `try/catch` (or `.catch`) around validation-sensitive calls and narrow errors with `instanceof HexaRemoteError`.

## Limits to know

- Validation is route-driven: no route, no generated validator.
- Validation is decorator-driven: DTOs without supported decorators do not get generated validators.
- Only the first method parameter is used as the inbound DTO contract.
- Primitive return types like `string` or `number` do not generate DTO validators.
- Decorators are compile-time metadata, not runtime enforcement by themselves.

## Related pages

- [Message Routing](./message-routing.md)
- [Controllers & Actions](./controllers.md)
- [Handlers & Handle](./handlers.md)
- [Build Pipeline](../cli-tooling/build-pipeline.md)

<ApiReferenceAppendix>
<ValidationDecoratorsAPI />
</ApiReferenceAppendix>
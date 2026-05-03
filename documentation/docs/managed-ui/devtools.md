---
title: DevTools
sidebar_position: 3
description: Build a managed React DevTools surface with DI, token injection, and HexaUIClient messaging.
---

import HexaUIClientAPI from '../reference-models/ui/services/hexa-ui-client-service.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# DevTools

HexaJS DevTools runs as a managed React surface. The managed UI bootstrap wires DI for you, so React code can resolve services and tokens directly.

## Enable managed React devtools

```json
{
  "ui": {
    "devtools": {
      "mode": "managed",
      "sourceDir": "ui/devtools",
      "indexFile": "index.html"
    }
  }
}
```

`mode: "managed"` runs the internal managed React build for DevTools.
`parallelBuild` defaults to `true` and runs managed popup + devtools builds in parallel during standard builds.
Set `parallelBuild` to `false` to force sequential managed UI builds.

## Resolve DevTools services with DI

```tsx
import { inject } from '@hexajs-dev/common';
import { RuntimePort } from '@hexajs-dev/ports';
import { HexaUIClient } from '@hexajs-dev/ui';

const runtimePort = inject(RuntimePort);
const hexaUIClient = inject(HexaUIClient);
```

Use `HexaUIClient` for typed request/response calls and `RuntimePort` for DevTools-side runtime events.

## Request data from background

```tsx
const [configResponse, clipsResponse] = await Promise.all([
  hexaUIClient.sendMessage<GetConfigMessage, ConfigResponseMessage>(configApi.Get, new GetConfigMessage(Date.now())),
  hexaUIClient.sendMessage<GetClipsMessage, ClipsResponseMessage>(clipboardApi.Get, new GetClipsMessage(Date.now()))
]);
```

## Resolve platform token

```tsx
import { HEXA_PLATFORM, inject } from '@hexajs-dev/common';

const platform = inject(HEXA_PLATFORM);
```

For constructor-based DI, token values use `@Inject(...)`:

```ts
import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.UI })
export class PlatformTokenExample {
  constructor(@Inject(HEXA_PLATFORM) readonly platform: string) {}
}
```

## Notes

- Keep long-lived state in background/content stores, not in DevTools surface state.
- Use DI directly in React code (`inject(...)`) for UI services/ports.
- Token injection in HexaJS uses `inject(TOKEN)` or `@Inject(TOKEN)`.

<ApiReferenceAppendix>
<HexaUIClientAPI />
</ApiReferenceAppendix>

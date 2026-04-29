---
title: Popup
sidebar_position: 2
description: Build a managed React popup with DI, token injection, and HexaUIClient messaging.
---

import HexaUIClientAPI from '../reference-models/ui/services/hexa-ui-client-service.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Popup

HexaJS popup uses the managed UI pipeline. The popup is a React surface with a pre-wired DI container, so UI code can resolve services and tokens directly.

## Enable managed React popup

In `hexa-cli.config.json`:

```json
{
  "ui": {
    "popup": {
      "mode": "managed",
      "sourceDir": "ui/popup",
      "indexFile": "index.html",
      "icons": "src/assets/clip-volt-2.svg"
    }
  }
}
```

`mode: "managed"` runs the internal managed React build for popup.
`sourceDir` points to the popup source folder. `indexFile` is the built HTML entry used in the manifest pipeline.
`parallelBuild` defaults to `true` and runs managed popup + devtools builds in parallel during standard builds.
Set `parallelBuild` to `false` to force sequential managed UI builds.

## Resolve popup services with DI

```tsx
import { inject } from '@hexajs-dev/common';
import { RuntimePort } from '@hexajs-dev/ports';
import { HexaUIClient } from '@hexajs-dev/ui';

const runtimePort = inject(RuntimePort);
const hexaUIClient = inject(HexaUIClient);
```

Use this pattern in popup React components and hooks when you need runtime APIs or background messaging.

## Load state from background

```tsx
import { inject } from '@hexajs-dev/common';
import { HexaUIClient } from '@hexajs-dev/ui';
import { configApi } from './api';
import { ConfigResponseMessage, GetConfigMessage } from './messages';

const hexaUIClient = inject(HexaUIClient);
const response = await hexaUIClient.sendMessage<GetConfigMessage, ConfigResponseMessage>(
  configApi.Get,
  new GetConfigMessage(Date.now())
);

if (response && !hasHexaError(response) && response.config) {
  setConfig(response.config);
}
```

## Send partial updates

```tsx
import { inject } from '@hexajs-dev/common';
import { HexaUIClient } from '@hexajs-dev/ui';
import { configApi } from './api';
import { ConfigResponseMessage, UpdateConfigMessage } from './messages';

const hexaUIClient = inject(HexaUIClient);

hexaUIClient.sendMessage<UpdateConfigMessage, ConfigResponseMessage>(
  configApi.Update,
  new UpdateConfigMessage({ theme: 'dark' })
);
```

## Resolve platform token

```tsx
import { HEXA_PLATFORM, inject } from '@hexajs-dev/common';

const platform = inject(HEXA_PLATFORM);
```

For constructor-based DI, token values use `@Inject(...)`:

```ts
import { Inject, Injectable, InjectableContext, HEXA_PLATFORM } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.UI })
export class PlatformTokenExample {
  constructor(@Inject(HEXA_PLATFORM) readonly platform: string) {}
}
```

## Notes

- Keep business state in background/content stores.
- Popup should render state returned from messaging calls.
- Token injection in HexaJS uses `inject(TOKEN)` or `@Inject(TOKEN)`.
- Keep docs snippets focused on DI, tokens, and messaging.

<ApiReferenceAppendix>
<HexaUIClientAPI />
</ApiReferenceAppendix>

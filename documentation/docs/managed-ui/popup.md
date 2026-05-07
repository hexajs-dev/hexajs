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
import { Inject, Injectable, HexaContext, HEXA_PLATFORM } from '@hexajs-dev/common';

@Injectable({ context: HexaContext.UI })
export class PlatformTokenExample {
  constructor(@Inject(HEXA_PLATFORM) readonly platform: string) {}
}
```

## Customize the Vite build

Each managed surface ships with a `vite.config.ts` in its source directory. HexaJS merges it with the internal build config, so you can extend it without replacing defaults.

```ts title="ui/popup/vite.config.ts"
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  define: {
    'import.meta.env.EXTENSION_VERSION': JSON.stringify(process.env.npm_package_version),
  },
  plugins: [
    // add extra Vite plugins here
  ],
});
```

Merge behaviour:
- **`plugins`** — your plugins are loaded first, then HexaJS injects its own (React, bootstrap). Duplicates by name are skipped.
- **`resolve.alias`** — merged with path aliases derived from `tsconfig.json` in the source directory.
- **`define`** — merged with HexaJS platform defines.
- **`build`** — you can extend most options, but managed output controls are preserved: `outDir`, `emptyOutDir`, `rollupOptions.input`, and `rollupOptions.output`. The internal `external` list is always preserved and merged with your additions.

:::note
The React framework plugin (`@vitejs/plugin-react`) is injected automatically. You do not need to add it — if it is detected in your config it will be skipped to avoid loading it twice.
:::

## Notes

- Keep business state in background/content stores.
- Popup should render state returned from messaging calls.
- Token injection in HexaJS uses `inject(TOKEN)` or `@Inject(TOKEN)`.
- Keep docs snippets focused on DI, tokens, and messaging.

<ApiReferenceAppendix>
<HexaUIClientAPI />
</ApiReferenceAppendix>

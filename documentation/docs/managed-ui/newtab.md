---
title: New Tab
sidebar_position: 4
description: Build a managed React New Tab page with DI, token injection, and HexaUIClient messaging.
---

import HexaUIClientAPI from '../reference-models/ui/services/hexa-ui-client-service.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# New Tab

HexaJS New Tab runs as a managed React surface that replaces the browser's default new tab page. The managed UI bootstrap wires DI for you, so React code can resolve services and tokens directly.

## Enable managed React new tab

In `hexa-cli.config.json`:

```json
{
  "ui": {
    "newtab": {
      "mode": "managed",
      "sourceDir": "ui/newtab",
      "indexFile": "index.html"
    }
  }
}
```

`mode: "managed"` runs the internal managed React build for the new tab page.
`sourceDir` points to the new tab source folder. `indexFile` is the built HTML entry used in the manifest pipeline.

## Platform behavior

The new tab override uses `chrome_url_overrides.newtab` in the generated manifest. Browser support varies:

| Platform | Behavior |
|----------|----------|
| Chrome, Edge, Brave, Opera | Activates immediately on extension install. |
| Firefox | Activates immediately. If multiple extensions override new tab, the first installed wins. |
| Safari | **Requires manual user opt-in.** See instructions below. |

## Safari: enabling the new tab override

Safari does not auto-activate new tab overrides. The user must manually select the extension as their new tab page provider.

### Without Safari Profiles

1. Open **Safari > Settings > General**.
2. Find the **"New tabs open with"** dropdown.
3. Select the extension name from the list.

### With Safari Profiles (macOS Sonoma and later)

Safari Profiles keep "New tabs open with" settings separate per profile:

1. Open **Safari > Settings > Profiles**.
2. Select the active profile (e.g., Personal, Work).
3. Go to the **Extensions** tab and ensure the extension is **enabled** for that profile.
4. Go to the **General** tab within the profile settings.
5. Change **"New tabs open with"** to the extension name.

:::warning
If the extension does not appear in the "New tabs open with" dropdown:

- Ensure the extension is **enabled** in Safari > Settings > Extensions.
- If using Profiles, ensure the extension is enabled **for the specific profile**.
- **Unsigned/development extensions** may not register the new tab override. This is a Safari limitation — the override fully works only with signed extensions (App Store or TestFlight).
- Try restarting Safari after enabling the extension.
:::

### Build-time warning

When building for Safari with a new tab page configured, HexaJS emits a warning:

```
Safari requires user opt-in for new tab overrides. Users must enable it in
Safari > Settings > General > "New tabs open with" and select this extension.
```

This is informational — the manifest is generated correctly. The warning reminds developers that Safari users need to take an extra step.

## Resolve new tab services with DI

```tsx
import { inject } from '@hexajs-dev/common';
import { RuntimePort } from '@hexajs-dev/ports';
import { HexaUIClient } from '@hexajs-dev/ui';

const runtimePort = inject(RuntimePort);
const hexaUIClient = inject(HexaUIClient);
```

## Load state from background

```tsx
import { inject } from '@hexajs-dev/common';
import { HexaUIClient } from '@hexajs-dev/ui';

const hexaUIClient = inject(HexaUIClient);
const response = await hexaUIClient.sendMessage(dashboardApi.GetStats, new GetStatsMessage());
```

## Customize the Vite build

The new tab surface supports the same Vite config customization as popup and devtools. Place a `vite.config.ts` in your source directory:

```ts title="ui/newtab/vite.config.ts"
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Notes

- Keep business state in background/content stores.
- New tab should render state returned from messaging calls.
- The new tab page has full access to extension APIs (`browser.*` / `chrome.*`).
- On Safari, the new tab page will not load until the user opts in via Settings.

<ApiReferenceAppendix>
<HexaUIClientAPI />
</ApiReferenceAppendix>

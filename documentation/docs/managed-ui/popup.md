---
title: Popup
sidebar_position: 2
description: Configure and build a managed popup with correct UI config keys and HexaUIClient messaging.
---

import HexaUIClientAPI from '../reference-models/ui/services/hexa-ui-client-service.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Popup

## Enable managed popup

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

`sourceDir` points to the popup source folder. `indexFile` is the built HTML entry used in the manifest pipeline.

## Load state from background

```tsx
import { inject } from '@hexajs/common';
import { HexaUIClient } from '@hexajs/ui';
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
import { inject } from '@hexajs/common';
import { HexaUIClient } from '@hexajs/ui';
import { configApi } from './api';
import { ConfigResponseMessage, UpdateConfigMessage } from './messages';

const hexaUIClient = inject(HexaUIClient);

hexaUIClient.sendMessage<UpdateConfigMessage, ConfigResponseMessage>(
  configApi.Update,
  new UpdateConfigMessage({ theme: 'dark' })
);
```

Use this pattern for popup-driven settings changes, commands, or one-off requests to background.

## Notes

- Keep business state in background/content stores.
- Popup should render state returned from messaging calls.
- Prefer small request/response snippets in docs and examples rather than copying an entire popup component.

<ApiReferenceAppendix>
<HexaUIClientAPI />
</ApiReferenceAppendix>

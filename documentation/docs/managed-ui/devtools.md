---
title: DevTools
sidebar_position: 3
description: Configure a managed DevTools surface with DI and HexaUIClient messaging.
---

import HexaUIClientAPI from '../reference-models/ui/services/hexa-ui-client-service.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# DevTools

## Enable managed devtools

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

`parallelBuild` defaults to `true` and runs managed popup + devtools builds in parallel during standard builds.
Set `parallelBuild` to `false` to force sequential managed UI builds.

## Usage model

- DevTools UI runs in its own extension UI context.
- Use `HexaUIClient` to ask background for data/actions.
- Keep long-lived state in background/content stores, not in devtools surface state.

<ApiReferenceAppendix>
<HexaUIClientAPI />
</ApiReferenceAppendix>

---
title: React Integration
sidebar_position: 4
description: Use React hooks from @hexajs/ui to access DI tokens and HexaUIClient in managed UI surfaces.
---

import HexaUIClientAPI from '../reference-models/ui/services/hexa-ui-client-service.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# React Integration

Managed UI React components run inside the generated UI DI container. In the ClipVault example, React components resolve `HexaUIClient` or tokens directly with `inject(...)` inside effects and event handlers.

## Request data in an effect

```tsx
import { inject } from '@hexajs/common';
import { HexaUIClient } from '@hexajs/ui';
import { configApi } from './api';
import { ConfigResponseMessage, GetConfigMessage } from './messages';

useEffect(() => {
  const load = async () => {
    const hexaUIClient = inject(HexaUIClient);
    const response = await hexaUIClient.sendMessage<GetConfigMessage, ConfigResponseMessage>(
      configApi.Get,
      new GetConfigMessage(Date.now())
    );

    if (response && !hasHexaError(response) && response.config) {
      setConfig(response.config);
    }
  };

  void load();
}, []);
```

## Send changes from an event handler

```tsx
import { inject } from '@hexajs/common';
import { HexaUIClient } from '@hexajs/ui';
import { configApi } from './api';
import { ConfigResponseMessage, UpdateConfigMessage } from './messages';

const hexaUIClient = inject(HexaUIClient);

await hexaUIClient.sendMessage<UpdateConfigMessage, ConfigResponseMessage>(
  configApi.Update,
  new UpdateConfigMessage({ theme: nextTheme })
);
```

## Resolve token values

```tsx
import { HEXA_PLATFORM, inject } from '@hexajs/common';

const platform = inject(HEXA_PLATFORM);
return <span>{platform}</span>;
```

## Important scope reminder

Managed UI React components resolve UI/general services and tokens. They do not resolve Background/Content store instances directly.

<ApiReferenceAppendix>
<HexaUIClientAPI />
</ApiReferenceAppendix>
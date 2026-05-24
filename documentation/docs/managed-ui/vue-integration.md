---
title: Vue Integration
sidebar_position: 5
description: Use Vue 3 single-file components from @hexajs-dev/ui to access DI tokens and HexaUIClient in managed UI surfaces.
---

import HexaUIClientAPI from '../reference-models/ui/services/hexa-ui-client-service.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Vue Integration

Managed UI Vue 3 components run inside the same generated UI DI container that React components use. The framework adapter is selected via a single project-wide flag in `hexa-cli.config.json`:

```json
{
  "ui": {
    "framework": "vue",
    "popup": { "mode": "managed", "sourceDir": "ui/popup", "indexFile": "index.html" }
  }
}
```

When `ui.framework: "vue"` is set, HexaJS injects `@vitejs/plugin-vue` into the popup/devtools/newtab build pipelines and emits content `@View` overlays that mount Vue components inside shadow DOM via `VueShadowRenderer` from `@hexajs-dev/ui/vue`.

> Vue support requires `vue@^3.5` and `@vitejs/plugin-vue@^5`. The framework choice is project-wide; mixed React + Vue per surface is not supported.

## Request data in `onMounted`

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { inject } from '@hexajs-dev/common';
import { HexaUIClient } from '@hexajs-dev/ui';
import { configApi } from './api';
import { ConfigResponseMessage, GetConfigMessage } from './messages';

const config = ref<unknown | null>(null);

onMounted(async () => {
  const hexaUIClient = inject(HexaUIClient);
  const response = await hexaUIClient.sendMessage<GetConfigMessage, ConfigResponseMessage>(
    configApi.Get,
    new GetConfigMessage(Date.now())
  );

  if (response && !hasHexaError(response) && response.config) {
    config.value = response.config;
  }
});
</script>

<template>
  <pre v-if="config">{{ config }}</pre>
</template>
```

`inject(...)` here is the HexaJS DI helper from `@hexajs-dev/common`, not Vue's own `inject` from `provide/inject`. The two never alias each other in HexaJS managed UI templates: HexaJS components import `inject` directly from `@hexajs-dev/common`.

## Send changes from an event handler

```vue
<script setup lang="ts">
import { inject } from '@hexajs-dev/common';
import { HexaUIClient } from '@hexajs-dev/ui';
import { configApi } from './api';
import { ConfigResponseMessage, UpdateConfigMessage } from './messages';

async function setTheme(nextTheme: 'light' | 'dark'): Promise<void> {
  const hexaUIClient = inject(HexaUIClient);
  await hexaUIClient.sendMessage<UpdateConfigMessage, ConfigResponseMessage>(
    configApi.Update,
    new UpdateConfigMessage({ theme: nextTheme })
  );
}
</script>
```

## Resolve token values

```vue
<script setup lang="ts">
import { HEXA_PLATFORM, inject } from '@hexajs-dev/common';

const platform = inject(HEXA_PLATFORM);
</script>

<template>
  <span>{{ platform }}</span>
</template>
```

## Shadow `@View` overlays

Vue components mounted inside a shadow DOM via `@View` receive the controller instance through the `controller` prop, exactly like the React renderer:

```ts
// sample-overlay.view.ts
import { HexaView, View } from '@hexajs-dev/core';
import SampleOverlayComponent from './sample-overlay.component.vue';
import styles from './sample-overlay.css?inline';

@View({ id: 'sample', component: SampleOverlayComponent, styles, anchorSelector: 'body' })
export class SampleOverlayView extends HexaView {
  count = 0;
  increment = (): number => ++this.count;
}
```

```vue
<!-- sample-overlay.component.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import type { SampleOverlayView } from './sample-overlay.view';

const props = defineProps<{
  controller: SampleOverlayView;
}>();

const count = ref(props.controller.count);
function tick(): void {
  count.value = props.controller.increment();
}
</script>

<template>
  <button type="button" @click="tick">Count: {{ count }}</button>
</template>
```

The component receives the same `controller: SampleOverlayView` prop signature as the React equivalent — keeping the `@InjectView` integration uniform across frameworks.

## Important scope reminder

Managed UI Vue components resolve UI/general services and tokens. They do **not** resolve `HexaBackgroundStore`/`HexaContentStore` directly; ask the background through `HexaUIClient` messages and let state live in the appropriate context.

<ApiReferenceAppendix>
<HexaUIClientAPI />
</ApiReferenceAppendix>

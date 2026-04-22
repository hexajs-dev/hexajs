---
title: Managed (ui)
description: Public API model reference for ui module packages/ui/src/popup/managed.ts.
---


### Functions

#### buildManagedPopup

Build the React popup from `config.sourceDir` using an internal Vite build,
resolving `@vitejs/plugin-react` from the user's project.
Returns the manifest-relative entry path (e.g. "ui/popup/index.html").

```ts
import { buildManagedPopup } from '@hexajs/ui';
```

```typescript
function buildManagedPopup(config: HexaUiSurfaceConfig | undefined, outputDir: string, minify: boolean, bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, cwd?: string): Promise<string>
```


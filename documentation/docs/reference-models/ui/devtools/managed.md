---
title: Managed (ui)
description: Public API model reference for ui module packages/ui/src/devtools/managed.ts.
---


### Functions

#### buildManagedDevtools

Build a managed devtools panel from `config.sourceDir` using an internal Vite build.
Returns the manifest-relative entry path (e.g. "ui/devtools/index.html").

```ts
import { buildManagedDevtools } from '@hexajs/ui';
```

```typescript
function buildManagedDevtools(config: HexaUiSurfaceConfig | undefined, outputDir: string, minify: boolean, bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, cwd?: string): Promise<string>
```


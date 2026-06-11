---
title: Managed (ui)
description: Public API model reference for ui module packages/ui/src/newtab/managed.ts.
---


### Functions

#### buildManagedNewtab

Build the managed new tab page from `config.sourceDir` using an internal Vite build,
resolving the framework's Vite plugin from the user's project.
Returns the manifest-relative entry path (e.g. "ui/newtab/index.html").

```ts
import { buildManagedNewtab } from '@hexajs-dev/ui';
```

```typescript
function buildManagedNewtab(config: HexaUiSurfaceConfig | undefined, outputDir: string, compilerOptions: HexaUiCompilerOptions, bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, hmrSessionToken?: string, cwd?: string, framework?: UiFrameworkName): Promise<string>
```


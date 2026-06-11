---
title: Managed (ui)
description: Public API model reference for ui module packages/ui/src/popup/managed.ts.
---


### Functions

#### buildManagedPopup

Build the managed popup from `config.sourceDir` using an internal Vite build,
resolving the framework's Vite plugin (e.g. `@vitejs/plugin-react` for the
React adapter, `@vitejs/plugin-vue` for the Vue adapter) from the user's project.
Returns the manifest-relative entry path (e.g. "ui/popup/index.html").

```ts
import { buildManagedPopup } from '@hexajs-dev/ui';
```

```typescript
function buildManagedPopup(config: HexaUiSurfaceConfig | undefined, outputDir: string, compilerOptions: HexaUiCompilerOptions, bootstrapPath: string, platform: string, watch?: boolean, hmrAddress?: string, hmrSessionToken?: string, cwd?: string, framework?: UiFrameworkName): Promise<string>
```


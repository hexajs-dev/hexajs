---
title: Fallback (ui)
description: Public API model reference for ui module packages/ui/src/core/fallback.ts.
---


### Functions

#### createFallbackSurface

Generate a minimal fallback HTML page for a surface when no source is found.
Returns the manifest-relative path of the generated file.

For devtools, generates a panel page inside `ui/devtools/` and a bridge page
that registers it via `chrome.devtools.panels.create()`.

```ts
import { createFallbackSurface } from '@hexajs-dev/ui';
```

```typescript
function createFallbackSurface(surface: HexaUiSurface, outputDir: string): string
```


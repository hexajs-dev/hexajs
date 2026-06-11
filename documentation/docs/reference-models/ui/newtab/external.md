---
title: External (ui)
description: Public API model reference for ui module packages/ui/src/newtab/external.ts.
---


### Functions

#### copyExternalNewtab

Copy a pre-built new tab dist into the extension output directory.
Returns the manifest-relative entry path.

```ts
import { copyExternalNewtab } from '@hexajs-dev/ui';
```

```typescript
function copyExternalNewtab(config: HexaUiSurfaceConfig, outputDir: string): string
```


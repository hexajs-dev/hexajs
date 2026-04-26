---
title: External (ui)
description: Public API model reference for ui module packages/ui/src/devtools/external.ts.
---


### Functions

#### copyExternalDevtools

Copy a pre-built devtools dist into the extension output directory.
Returns the manifest-relative entry path.

```ts
import { copyExternalDevtools } from '@hexajs-dev/ui';
```

```typescript
function copyExternalDevtools(config: HexaUiSurfaceConfig, outputDir: string): string
```


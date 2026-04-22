---
title: External (ui)
description: Public API model reference for ui module packages/ui/src/popup/external.ts.
---


### Functions

#### copyExternalPopup

Copy a pre-built popup dist into the extension output directory.
Returns the manifest-relative entry path.

```ts
import { copyExternalPopup } from '@hexajs/ui';
```

```typescript
function copyExternalPopup(config: HexaUiSurfaceConfig, outputDir: string): string
```


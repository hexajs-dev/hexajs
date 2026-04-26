---
title: Types (ui)
description: Public API model reference for ui module packages/ui/src/core/types.ts.
---


### Types & Interfaces

#### HexaUiConfig

```ts
import { HexaUiConfig } from '@hexajs-dev/ui';
```

```typescript
interface HexaUiConfig {
    popup?: HexaUiSurfaceConfig;
    devtools?: HexaUiSurfaceConfig;
}
```

#### HexaUiSurfaceConfig

```ts
import { HexaUiSurfaceConfig } from '@hexajs-dev/ui';
```

```typescript
interface HexaUiSurfaceConfig {
    mode?: HexaUiMode;
    sourceDir?: string;
    distDir?: string;
    indexFile?: string;
    buildCommand?: string;
    viteConfig?: string;
}
```

#### ManifestUiEntries

Resolved output paths for each UI surface, written into the extension manifest

```ts
import { ManifestUiEntries } from '@hexajs-dev/ui';
```

```typescript
interface ManifestUiEntries {
    popup?: string;
    devtools?: string;
}
```

#### HexaUiMode

```ts
import { HexaUiMode } from '@hexajs-dev/ui';
```

```typescript
type HexaUiMode = 'managed' | 'external' | 'none';
```

#### HexaUiSurface

```ts
import { HexaUiSurface } from '@hexajs-dev/ui';
```

```typescript
type HexaUiSurface = 'popup' | 'devtools';
```


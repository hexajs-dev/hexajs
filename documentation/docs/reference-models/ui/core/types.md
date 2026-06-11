---
title: Types (ui)
description: Public API model reference for ui module packages/ui/src/core/types.ts.
---


### Types & Interfaces

#### HexaUiCompilerOptions

```ts
import { HexaUiCompilerOptions } from '@hexajs-dev/ui';
```

```typescript
interface HexaUiCompilerOptions {
    minify: false | 'esbuild' | 'terser';
    cssMinify: boolean | 'esbuild' | 'lightningcss';
    sourceMap: boolean | 'inline' | 'hidden';
    terserOptions: Record<string, unknown>;
}
```

#### HexaUiConfig

```ts
import { HexaUiConfig } from '@hexajs-dev/ui';
```

```typescript
interface HexaUiConfig {
    framework?: HexaUiFrameworkName;
    popup?: HexaUiSurfaceConfig;
    devtools?: HexaUiSurfaceConfig;
    newtab?: HexaUiSurfaceConfig;
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
    newtab?: string;
}
```

#### HexaUiFrameworkName

```ts
import { HexaUiFrameworkName } from '@hexajs-dev/ui';
```

```typescript
type HexaUiFrameworkName = 'react' | 'vue';
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
type HexaUiSurface = 'popup' | 'devtools' | 'newtab';
```


---
title: Framework Adapter (ui)
description: Public API model reference for ui module packages/ui/src/core/framework-adapter.ts.
---


### Types & Interfaces

#### ShadowRendererImport

Description of where a framework's ShadowRenderer lives, used by the CLI's

```ts
import { ShadowRendererImport } from '@hexajs-dev/ui';
```

```typescript
interface ShadowRendererImport {
    module: string;
    exportName: string;
}
```

#### UiFrameworkAdapter

The contract every UI-framework integration must implement.

The adapter centralises framework-specific knowledge so the rest of the
managed UI pipeline (popup/devtools/newtab builders, content

```ts
import { UiFrameworkAdapter } from '@hexajs-dev/ui';
```

```typescript
interface UiFrameworkAdapter {
    name: UiFrameworkName;
    vitePluginPackage: string;
    loadVitePlugin(cwd: string): Plugin | Plugin[];
    shadowRendererImport: ShadowRendererImport;
    componentExtensions: readonly string[];
    dedupe: readonly string[];
}
```

#### UiFrameworkName

Names of UI frameworks supported by HexaJS managed UI.

Adding a new framework (e.g. 'svelte') requires:
 - A new adapter implementation in `src/core/adapters/<name>.adapter.ts`
 - A new shadow renderer service exposed at

```ts
import { UiFrameworkName } from '@hexajs-dev/ui';
```

```typescript
type UiFrameworkName = 'react' | 'vue';
```


### Functions

#### getAdapter

Look up an adapter by framework name. Throws a clear, typed error for
unsupported framework names so future contributors see exactly where to
register a new framework.

```ts
import { getAdapter } from '@hexajs-dev/ui';
```

```typescript
function getAdapter(name: UiFrameworkName | string): UiFrameworkAdapter
```


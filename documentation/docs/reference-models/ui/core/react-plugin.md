---
title: React Plugin (ui)
description: Public API model reference for ui module packages/ui/src/core/react-plugin.ts.
---


### Types & Interfaces

#### ReactPluginFn

```ts
import { ReactPluginFn } from '@hexajs-dev/ui';
```

```typescript
type ReactPluginFn = (...args: unknown[]) => Plugin | Plugin[];
```


### Functions

#### loadReactPlugin

Resolve `@vitejs/plugin-react` from the **user's** project at build time.
The Hexa packages never own framework plugins — they must live in the
user project's node_modules.

```ts
import { loadReactPlugin } from '@hexajs-dev/ui';
```

```typescript
function loadReactPlugin(cwd: string): ReactPluginFn
```


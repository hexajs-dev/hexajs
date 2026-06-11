---
title: Vue Plugin (ui)
description: Public API model reference for ui module packages/ui/src/core/vue-plugin.ts.
---


### Types & Interfaces

#### VuePluginFn

```ts
import { VuePluginFn } from '@hexajs-dev/ui';
```

```typescript
type VuePluginFn = (...args: unknown[]) => Plugin | Plugin[];
```


### Functions

#### loadVuePlugin

Resolve `@vitejs/plugin-vue` from the **user's** project at build time.
The Hexa packages never own framework plugins — they must live in the
user project's node_modules.

Throws a precise, actionable error message when the plugin (or `vue`) is
missing, naming the install command the user should run.

```ts
import { loadVuePlugin } from '@hexajs-dev/ui';
```

```typescript
function loadVuePlugin(cwd: string): VuePluginFn
```


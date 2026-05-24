---
title: Adding a UI Framework
sidebar_position: 1
description: The contract for adding new UI framework support (Vue, Svelte, ...) to HexaJS managed UI without changing core build code.
---

# Adding a UI Framework

HexaJS managed UI is built around a small `UiFrameworkAdapter` contract so that adding a new framework — for example, Svelte — never requires changes inside the popup, devtools, newtab, or content `@View` builders. This page documents that contract end-to-end so a future contributor has a single checklist to follow.

> **Status:** React and Vue are first-class. Svelte is the worked-out next case used as the running example below. Once Svelte is added, this page should be updated with the second concrete adapter.

## What is required, in short

For a new framework named `<name>` you must provide:

1. A Vite plugin **loader** that resolves the framework's plugin from the user's project (the CLI never ships these plugins itself).
2. An **adapter** that implements `UiFrameworkAdapter`, exposing the loader, the deduped runtime modules, and the shadow renderer subpath.
3. A **shadow renderer** (`<Name>ShadowRenderer.mount({...})`) at `@hexajs-dev/ui/<name>` with the exact same call signature as the React/Vue renderers.
4. **Scaffold templates** for popup, devtools, and newtab, plus a `hexa new` prompt branch and `hexa add ui` dispatch branch.
5. A guard test that ensures `getAdapter('<name>')` resolves and unsupported names throw a clear error pointing back to this doc.

The full file-by-file checklist is below.

## The `UiFrameworkAdapter` contract

```ts
// packages/ui/src/core/framework-adapter.ts
export type UiFrameworkName = 'react' | 'vue' /* | 'svelte' */;

export interface UiFrameworkAdapter {
  name: UiFrameworkName;
  /** Plugin package the user must install (used for actionable error messages). */
  vitePluginPackage: string;
  /** Throws a clear error when the plugin is missing. */
  loadVitePlugin(cwd: string): Plugin | Plugin[];
  /** Where the CLI's @View generator imports the renderer from. */
  shadowRendererImport: { module: string; exportName: string };
  /** SFC/JSX file extensions associated with the framework. */
  componentExtensions: readonly string[];
  /** resolve.dedupe modules (e.g. ['react','react-dom'] or ['vue']). */
  dedupe: readonly string[];
}

export function getAdapter(name: UiFrameworkName): UiFrameworkAdapter;
```

Each adapter is intentionally tiny: it's a declarative constant that links a plugin loader, dedupe list, and shadow renderer subpath together. The framework runtime itself is **not** imported eagerly — it lives behind the loader, so adding Svelte does not bloat React- or Vue-only bundles.

## Concrete checklist (running example: Svelte)

### 1. Vite plugin loader

`packages/ui/src/core/svelte-plugin.ts` — mirror `react-plugin.ts` and `vue-plugin.ts`:

- Use `createRequire(path.join(cwd, 'package.json'))` to resolve `@sveltejs/vite-plugin-svelte` from the **user project**, never from the workspace.
- Throw a clear error: `'@sveltejs/vite-plugin-svelte' is not installed in your project. Run: pnpm add -D @sveltejs/vite-plugin-svelte svelte`.

### 2. Adapter

`packages/ui/src/core/adapters/svelte.adapter.ts`:

```ts
import type { Plugin } from 'vite';
import type { UiFrameworkAdapter } from '../framework-adapter';
import { loadSveltePlugin } from '../svelte-plugin';

export const svelteAdapter: UiFrameworkAdapter = {
  name: 'svelte',
  vitePluginPackage: '@sveltejs/vite-plugin-svelte',
  loadVitePlugin(cwd: string): Plugin | Plugin[] { return loadSveltePlugin(cwd)(); },
  shadowRendererImport: { module: '@hexajs-dev/ui/svelte', exportName: 'SvelteShadowRenderer' },
  componentExtensions: ['.svelte'] as const,
  dedupe: ['svelte'] as const,
};
```

Then register it in `framework-adapter.ts`:

```ts
import { svelteAdapter } from './adapters/svelte.adapter';

const adapters: Record<UiFrameworkName, UiFrameworkAdapter> = {
  react: reactAdapter,
  vue: vueAdapter,
  svelte: svelteAdapter,
};
```

Add `'svelte'` to the `UiFrameworkName` union and to `cli/bin/config/config.ts` `UiFrameworkName` and the JSON schema enum (`packages/cli/src/bin/config/hexa-cli.schema.json` and `packages/cli/schema/hexa-cli.schema.json`).

### 3. Shadow renderer

`packages/ui/src/services/svelte-shadow-renderer.ts`:

- Match the React/Vue renderer surface exactly:
  ```ts
  static mount({ id, component, controllerInstance, cssText, anchorSelector }): () => void
  ```
- Internally instantiate the Svelte component with `target: mountElement, props: { controller: controllerInstance }`.
- Return a teardown closure that calls `component.$destroy()` and removes the host element.

Add the corresponding entries:
- `packages/ui/src/services/svelte.ts` (subpath barrel).
- `packages/ui/vite.config.ts` `lib.entry`: add `svelte: 'src/services/svelte.ts'` and add `'svelte'`/`/^svelte\//` to `BROWSER_EXTERNALS`.
- `packages/ui/package.json` `exports`: add `./svelte` block alongside `./react` and `./vue`.
- `packages/ui/package.json` peer deps: `svelte` and `@sveltejs/vite-plugin-svelte` (both `optional: true` in `peerDependenciesMeta`).

### 4. CLI scaffold templates

Mirror the existing template fan-out under `packages/cli/src/bin/programs/new/templates/`:

- `popup-{main,app,index-html,vite-config,tsconfig}-svelte.template.ts`
- `devtools-{main,app,index-html,vite-config,tsconfig}-svelte.template.ts`
- `newtab-{main,app,index-html,vite-config,tsconfig}-svelte.template.ts`

CSS templates (`popup-style`, `devtools-style`, `newtab-style`) are framework-agnostic and shared. The bridge `devtools.html` and `devtools.ts` entry are also shared.

### 5. Scaffold dispatch

In `packages/cli/src/bin/programs/new/services/scaffold.service.ts`, extend the `isVue` branch into a switch on `ctx.framework`. Update:

- `packages/cli/src/bin/programs/new/templates/package-json.template.ts` — emit `svelte` dependency and `@sveltejs/vite-plugin-svelte` + `svelte-check` devDeps under `framework === 'svelte'`.
- `packages/cli/src/bin/programs/new/templates/hexa-config.template.ts` — already emits `ui.framework`, no change needed.
- `packages/cli/src/bin/programs/new/new.ts` — add `{ name: 'svelte', message: 'Svelte ...' }` to the framework prompt choices.

### 6. `hexa add ui` dispatch

In `packages/cli/src/bin/programs/schematics/ui-surface-files.ts`, extend `buildPopupFiles` and `buildDevtoolsFiles` to handle the new `framework === 'svelte'` branch and route to the Svelte templates.

### 7. Guard test

Add a focused test in `packages/ui/tests/`:

```ts
import { describe, expect, it } from 'vitest';
import { getAdapter } from '../src/core/framework-adapter';

describe('getAdapter', () => {
  it('returns the registered adapter for known frameworks', () => {
    expect(getAdapter('react').name).toBe('react');
    expect(getAdapter('vue').name).toBe('vue');
    expect(getAdapter('svelte').name).toBe('svelte');
  });

  it('throws a contributor-friendly error for unknown frameworks', () => {
    expect(() => getAdapter('solid' as any)).toThrow(/Unsupported UI framework/);
    expect(() => getAdapter('solid' as any)).toThrow(/adding-frameworks/);
  });
});
```

### 8. Documentation

- New `documentation/docs/managed-ui/svelte-integration.md` mirroring `vue-integration.md` (request data in `onMount`, send change in handler, resolve token, scope reminder).
- Update `documentation/sidebars.ts` to include `'managed-ui/svelte-integration'`.
- Update `documentation/docs/managed-ui/index.md` to mention Svelte alongside React/Vue.
- Update `hexa-features.md` and the project `README.md` matrices.

### 9. End-to-end example

Add `examples/hexa-svelte-starter` mirroring `examples/hexa-vue-starter`. CI's existing turbo build target already picks it up via `examples/*` in `pnpm-workspace.yaml`.

## CI test checklist

A pull request adding a new framework must keep the following green, in order:

1. `pnpm --filter @hexajs-dev/ui test` — Vue/React shadow renderer tests + the new framework's renderer test.
2. `pnpm --filter @hexajs-dev/cli test` — scaffold service + new command + add command tests, with new cases for the framework branch.
3. `pnpm --filter examples/hexa-<framework>-starter build` — end-to-end build of the new starter.
4. Manual smoke test: load `dist/chrome/production` as an unpacked extension and confirm popup + content overlay render.

## Things you should not change

The popup/devtools/newtab managed builders, the content `@View` generator, the bundler-framework loader, and the `hexa new`/`hexa add ui` shells are intentionally framework-agnostic. They consume the adapter contract; they should not learn about a new framework directly. If you find yourself editing them to support a new framework, the contract is wrong — open an issue before continuing.

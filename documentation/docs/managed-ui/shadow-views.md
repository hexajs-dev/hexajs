---
title: Shadow Views
sidebar_position: 6
description: Advanced patterns for Shadow DOM-backed views, lifecycle control, and framework-driven injected UI.
---

# Shadow Views

> **Target Audience:** Advanced
> **Goal:** Build injected UI surfaces that render in Shadow DOM with explicit lifecycle control and clear separation between View logic and component rendering.

Shadow Views are the HexaJS pattern for mounting isolated UI into the page through Shadow DOM. They are ideal when you need extension-owned UI that must avoid page CSS collisions and be mounted only when a workflow starts.

This pattern combines three parts:

1. a view class declared with `@View({ ... })`,
2. a framework component rendered inside the Shadow Root — React or Vue today, with more frameworks planned,
3. property injection with `@InjectView()` where consumers receive the view controller directly.

## Why use Shadow Views

Injected UI lives in hostile territory: arbitrary site CSS, arbitrary DOM structure, and pages that can mutate at any time.

Shadow Views are useful because they give you:

- a dedicated host element per mounted surface,
- an open Shadow Root for style isolation,
- CSS injected directly into that Shadow Root,
- explicit mount and teardown lifecycle through `HexaView` methods,
- a clean split between orchestration in the view class and rendering in the framework component.

## Define the view

A view class extends `HexaView` and is decorated with `@View`. The `@View` decorator API is the same regardless of framework — only the `component` import differs.

```ts
import { HexaView, View } from '@hexajs-dev/core';
import { YourOverlayComponent } from './your-overlay.component'; // .tsx for React, .vue for Vue
import styles from './your-overlay.css?inline';

@View({
  id: 'your-overlay',
  component: YourOverlayComponent,
  styles,
  anchorSelector: 'body',
})
export class YourOverlayView extends HexaView {
  // domain state and lifecycle helpers live here
}
```

Key points:

- `component` accepts a React function component or a Vue SFC. HexaJS selects the renderer based on `ui.framework` in `hexa-cli.config.json`.
- `styles` is injected into the Shadow Root at mount time.
- `HexaView` exposes `mount()`, `unmount()`, and `isMounted` directly on the class.

For a complete, working example with your framework see the guides below.

## Inject the view into content services

Consumers inject views as class properties with `@InjectView()`. The property type is used to infer the view class.

```ts
import { Content, InjectView } from '@hexajs-dev/core';
import { ClipboardOverlayView } from './ui/clipboard-overlay/clipboard-overlay.view';

@Content()
export class ClipVaultContent {
  @InjectView() overlay!: ClipboardOverlayView;

  onToggleShortcut(): void {
    this.overlay.toggle();
  }
}
```

This means:

- no constructor `@injectView(...)` parameters,
- no `@ViewRef()` parameter wiring,
- view consumers call the controller methods directly.

## Runtime flow

At runtime the flow is:

1. the CLI generates registration code for the decorated view,
2. the generated code instantiates the view and wires its internal lifecycle reference,
3. for each `@InjectView()` property, generated bootstrap assigns the resolved view controller to that property,
4. when `view.mount()` is called, HexaJS delegates to the internal mount pipeline,
5. the appropriate renderer (`ReactShadowRenderer` or `VueShadowRenderer`) resolves the anchor, creates a host element, attaches `attachShadow({ mode: 'open' })`, injects styles, and renders the component tree.

The mount root element also gets `style.all = 'initial'`, which helps prevent inherited page styles from corrupting the view before your own CSS loads.

## The framework component

The component receives the view instance as the `controller` prop. The component owns render state, DOM interaction, and store subscriptions. The view class owns lifecycle operations and domain state.

See the framework-specific guide for a complete working example:

- [Shadow Views — React](./shadow-views-react)
- [Shadow Views — Vue](./shadow-views-vue)

## How the view loads the renderer

When your content code calls `this.overlay.mount()` (or a helper like `toggle()`), HexaJS performs this sequence:

1. resolve the configured anchor (`body` or your selector),
2. create host element `hexa-{id}` and attach open Shadow Root,
3. inject the view CSS into the Shadow Root,
4. create a root container element with `style.all = 'initial'`,
5. render your `component` with `{ controller: viewInstance }` — via `ReactShadowRenderer` for React projects or `VueShadowRenderer` for Vue projects.

The View is always the lifecycle/controller class. React or Vue is the UI renderer, chosen by `ui.framework` in your config.

## What the renderer actually does

Both `ReactShadowRenderer` and `VueShadowRenderer` follow the same concrete sequence:

1. resolve `document.querySelector(anchorSelector || 'body')`,
2. create a host element named `hexa-${id}`,
3. attach an open Shadow Root,
4. inject a `<style>` tag when inline CSS is available,
5. create a root mount element,
6. set `mountElement.style.all = 'initial'`,
7. render the component with `{ controller: viewInstance }`,
8. return a teardown function that unmounts the app and removes the host element.

The only difference is step 7: React calls `ReactDOM.createRoot(...).render(...)` while Vue calls `createApp(component, { controller }).mount(...)`.

If the anchor is missing, HexaJS throws immediately. That is the right failure mode for injected UI because a silent fallback can hide broken mount assumptions.

## Lifecycle control

Shadow Views are not mounted just because the DI container exists. They mount only when your flow requests it.

```ts
overlay.mount();
overlay.unmount();
```

Key rules:

- `mount()` is explicit.
- calling `mount()` twice without an `unmount()` throws.
- `unmount()` removes both the component tree and the host element.

This is one of the main reasons Shadow Views work well for overlays, transient selection tools, and dismissible panels.

## Choosing the right anchor

`anchorSelector` decides where the host element is attached.

- Use `body` for overlays, floating drawers, and selection tools.
- Use a specific container only when that container is stable enough to survive the page lifecycle you care about.
- Avoid deep brittle selectors unless your content logic is already responsible for re-resolving them.

If the page is highly dynamic, a stable top-level anchor plus internal positioning logic is usually the safer design.

## Design guidance

- Keep the view class small and lifecycle-focused.
- Keep rendering logic in the framework component (React or Vue).
- Keep store reads in the component layer or in injected services, not in ad hoc DOM callbacks.
- Keep Shadow View styles fully self-contained.
- Keep `id` stable because it affects the rendered host structure.
- Keep explicit teardown paths so overlays do not linger across page transitions.

## Related reading

- [Shadow Views — React](./shadow-views-react)
- [Shadow Views — Vue](./shadow-views-vue)
- [Popup](./popup)
- [State Management](../state-management/)
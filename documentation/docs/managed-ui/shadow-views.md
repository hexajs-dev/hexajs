---
title: Shadow Views
sidebar_position: 5
description: Advanced patterns for Shadow DOM-backed views, lifecycle control, and React-driven injected UI.
---

# Shadow Views

> **Target Audience:** Advanced
> **Goal:** Build injected UI surfaces that render in Shadow DOM with explicit lifecycle control and clear separation between View logic and React rendering.

Shadow Views are the HexaJS pattern for mounting isolated UI into the page through Shadow DOM. They are ideal when you need extension-owned UI that must avoid page CSS collisions and be mounted only when a workflow starts.

This pattern combines three parts:

1. a view class declared with `@View({ ... })`,
2. a React component rendered inside the Shadow Root,
3. property injection with `@InjectView()` where consumers receive the view controller directly.

## Why use Shadow Views

Injected UI lives in hostile territory: arbitrary site CSS, arbitrary DOM structure, and pages that can mutate at any time.

Shadow Views are useful because they give you:

- a dedicated host element per mounted surface,
- an open Shadow Root for style isolation,
- CSS injected directly into that Shadow Root,
- explicit mount and teardown lifecycle through `HexaView` methods,
- a clean split between orchestration in the view class and rendering in React.

## Define the view

A view class extends `HexaView` and is decorated with `@View`. The decorator points to the React component and style payload.

```ts
import { HexaView, View } from '@hexajs-dev/core';
import { ClipboardOverlayComponent } from './clipboard-overlay.component';
import styles from './clipboard-overlay.scss?inline';

@View({
  id: 'clip-vault-overlay',
  component: ClipboardOverlayComponent,
  styles,
  anchorSelector: 'body',
})
export class ClipboardOverlayView extends HexaView {
  toggle(): void {
    if (this.isMounted) {
      this.unmount();
      return;
    }
    this.mount();
  }

  closeOverlay(): void {
    this.unmount();
  }
}
```

What matters here:

- `component` is the actual React component that will be rendered.
- `styles` is injected into the Shadow Root at mount time.
- `HexaView` exposes `mount()`, `unmount()`, and `isMounted` directly on the class.

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
5. `ReactShadowRenderer.mount(...)` resolves the anchor, creates a host element, attaches `attachShadow({ mode: 'open' })`, injects styles, and renders the React tree.

The React mount target also gets `style.all = 'initial'`, which helps prevent inherited page styles from corrupting the view before your own CSS loads.

## The actual React component

The React component receives the view instance as `controller`. This is where the actual React tree is rendered.

```tsx
import React, { useEffect, useRef } from 'react';
import { inject } from '@hexajs-dev/common';
import { HexaContentStore, select } from '@hexajs-dev/core';
import { ClipItem } from '../../../contract/messages';
import { ContentState } from '../../store/content.reducer';
import { selectConfig, selectFilteredClips } from '../../store/content.selectors';
import { ClipboardOverlayView } from './clipboard-overlay.view';
import { ClipVaultConfig } from '@contract/config';

export function ClipboardOverlayComponent({ controller }: { controller: ClipboardOverlayView }): JSX.Element | null {
  const store = inject(HexaContentStore<ContentState>);
  const [filteredClips, setFilteredClips] = React.useState<ClipItem[]>([]);
  const [config, setConfig] = React.useState<ClipVaultConfig | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const subscription = store.pipe(select(selectFilteredClips)).subscribe(filteredClipts => {
      setFilteredClips(filteredClipts);
    });
    return () => subscription.unsubscribe();
  }, [store]);

  useEffect(() => {
    const subscription = store.pipe(select(selectConfig)).subscribe(config => {
      setConfig(config);
    });
    return () => subscription.unsubscribe();
  }, [store]);

  return (
    <div className={`cv-overlay cv-overlay--${config?.theme || 'dark'}`}>
      <div className="cv-overlay__backdrop" />
      <div className="cv-overlay__panel">
        <div className="cv-overlay__search-bar">
          <input ref={inputRef} className="cv-overlay__search-input" type="text" placeholder="Search your clips..." onChange={(e) => {}} />
          <button className="cv-overlay__close-btn" onClick={() => controller.closeOverlay()} aria-label="Close">
            Close
          </button>
        </div>
        <div className="cv-overlay__list" role="listbox">
          {filteredClips.map((clip) => (
            <div key={clip.id}>
              {clip.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

This example is important because it shows the actual split of responsibilities:

- the React component owns render state, DOM interaction, and store subscriptions,
- the view class owns lifecycle operations such as mount, unmount, and domain actions,
- the framework passes the view instance into the React tree as the `controller` prop.

## How the view loads React

When your content code calls `this.overlay.mount()` (or a helper like `toggle()`), HexaJS performs this sequence:

1. resolve the configured anchor (`body` or your selector),
2. create host element `hexa-{id}` and attach open Shadow Root,
3. inject the view CSS into the Shadow Root,
4. create React root container with `style.all = 'initial'`,
5. render your `component` with `{ controller: viewInstance }`.

So the View is the lifecycle/controller class, and React is the actual UI renderer.

## What the renderer actually does

The Shadow View renderer follows a concrete sequence:

1. resolve `document.querySelector(anchorSelector || 'body')`,
2. create a host element named `hexa-${id}`,
3. attach an open Shadow Root,
4. inject a `<style>` tag when inline CSS is available,
5. create a React root element,
6. set `reactRootElement.style.all = 'initial'`,
7. render the component with `{ controller: viewInstance }`,
8. return a teardown function that unmounts React and removes the host element.

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
- `unmount()` removes both the React tree and the host element.

This is one of the main reasons Shadow Views work well for overlays, transient selection tools, and dismissible panels.

## Choosing the right anchor

`anchorSelector` decides where the host element is attached.

- Use `body` for overlays, floating drawers, and selection tools.
- Use a specific container only when that container is stable enough to survive the page lifecycle you care about.
- Avoid deep brittle selectors unless your content logic is already responsible for re-resolving them.

If the page is highly dynamic, a stable top-level anchor plus internal positioning logic is usually the safer design.

## Design guidance

- Keep the view class small and lifecycle-focused.
- Keep rendering logic in the React component.
- Keep store reads in the React layer or in injected services, not in ad hoc DOM callbacks.
- Keep Shadow View styles fully self-contained.
- Keep `id` stable because it affects the rendered host structure.
- Keep explicit teardown paths so overlays do not linger across page transitions.

## Related reading

- [Popup](./popup)
- [React Integration](./react-integration)
- [State Management](../state-management/)
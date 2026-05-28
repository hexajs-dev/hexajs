---
title: Shadow Views — React
sidebar_position: 7
description: Complete guide for building Shadow DOM-backed views with React function components in HexaJS.
---

# Shadow Views — React

> This page covers the React-specific implementation. For shared concepts — `@View`, `@InjectView`, lifecycle control, and anchor selection — see [Shadow Views](./shadow-views).

## Complete example

A Shadow View has two files: the view class (`.ts`) and the React component (`.tsx`). They always live side by side.

### The view class

The view class extends `HexaView`, holds domain state, and exposes lifecycle helpers. The `component` field points to a React function component.

```ts
// clipboard-overlay.view.ts
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

### The React component

The component is a standard React function component. HexaJS passes the view instance as the `controller` prop.

```tsx
// clipboard-overlay.component.tsx
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
    const subscription = store.pipe(select(selectFilteredClips)).subscribe(clips => {
      setFilteredClips(clips);
    });
    return () => subscription.unsubscribe();
  }, [store]);

  useEffect(() => {
    const subscription = store.pipe(select(selectConfig)).subscribe(cfg => {
      setConfig(cfg);
    });
    return () => subscription.unsubscribe();
  }, [store]);

  return (
    <div className={`cv-overlay cv-overlay--${config?.theme || 'dark'}`}>
      <div className="cv-overlay__backdrop" />
      <div className="cv-overlay__panel">
        <div className="cv-overlay__search-bar">
          <input
            ref={inputRef}
            className="cv-overlay__search-input"
            type="text"
            placeholder="Search your clips..."
            onChange={() => {}}
          />
          <button
            className="cv-overlay__close-btn"
            onClick={() => controller.closeOverlay()}
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="cv-overlay__list" role="listbox">
          {filteredClips.map((clip) => (
            <div key={clip.id}>{clip.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Patterns

### Type the `controller` prop against the view class

Always type `controller` against the concrete view class, not a partial interface. This gives you full autocomplete on domain methods and catches renamed methods at compile time.

```tsx
// correct — typed against the class
export function MyOverlay({ controller }: { controller: MyOverlayView }) { ... }

// avoid — loses type safety on domain methods
export function MyOverlay({ controller }: { controller: { mount: () => void } }) { ... }
```

### Store subscriptions belong in effects

Content store subscriptions are RxJS-based. Subscribe in `useEffect` and return the unsubscribe teardown so React cleans up correctly on unmount.

```tsx
useEffect(() => {
  const sub = store.pipe(select(mySelector)).subscribe(value => setState(value));
  return () => sub.unsubscribe();
}, [store]);
```

### Call controller methods from event handlers

The `controller` reference is stable for the lifetime of the mounted view. Call domain methods on it directly from event handlers — no `useCallback` wrapping needed.

```tsx
<button onClick={() => controller.closeOverlay()}>Close</button>
```

## How `ReactShadowRenderer` works

When `mount()` is called on the view, HexaJS runs this sequence:

1. resolve `document.querySelector(anchorSelector || 'body')`,
2. create a host element named `hexa-${id}`,
3. attach an open Shadow Root,
4. inject a `<style>` tag with your inline CSS,
5. create a React root element inside the Shadow Root,
6. set `reactRootElement.style.all = 'initial'`,
7. render `<YourComponent controller={viewInstance} />`,
8. return a teardown that calls `root.unmount()` and removes the host element.

The `style.all = 'initial'` reset on the React root container prevents inherited page styles from affecting your component before your own CSS loads.

## Suggested file structure

```
src/
  content/
    ui/
      clipboard-overlay/
        clipboard-overlay.view.ts       ← HexaView subclass + @View decorator
        clipboard-overlay.component.tsx ← React function component
        clipboard-overlay.scss          ← scoped styles (imported ?inline)
```

## Related reading

- [Shadow Views](./shadow-views) — shared concepts
- [React Integration](./react-integration) — DI, `HexaUIClient`, managed UI surfaces
- [State Management](../state-management/)

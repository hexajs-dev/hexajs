---
title: Create a Grayscale Extension
sidebar_position: 2
description: Step-by-step guide for building a content-side grayscale toggle using HexaJS views.
---

# Create a Grayscale Extension

This tutorial builds a small extension that adds an eye icon to each page and toggles grayscale for that page only.

> **Target audience:** First-time HexaJS users
> **Estimated time:** 20 to 30 minutes

## Final behavior

After you finish:

- Every matched page shows a floating eye button in the lower-right corner.
- Clicking the eye toggles grayscale for the current page.
- Reloading or navigating creates a clean instance with no duplicated UI.

## Step 1: Create a new extension with the CLI

Use the HexaJS CLI to scaffold a new extension:

```bash
hexa new hexa-grayscale
```

The CLI will prompt you with these choices:

**1. Project name** (already provided as `hexa-grayscale`)
```
✓ Project name: hexa-grayscale
```

**2. Select project template**
```
Select project template
  ◉ Blank (background + content only, ready to build from scratch)
  ○ Full (background + content + store + services + ping/pong demo)
→ Choose "Blank"
```

**3. Select target platforms**
```
Select target platforms (space to toggle, enter to confirm)
  ◉ chrome
  ○ firefox
  ○ safari
  ○ opera
  ○ edge
  ○ brave
→ Keep "chrome" selected, press Enter
```

**4. Add a React popup?**
```
Add a React popup? (managed by Hexa) (y/N)
→ Type "y" or press Enter for "Yes"
```

**5. Add a managed React DevTools panel?**
```
Add a managed React DevTools panel? (y/N)
→ Type "n" or press Enter for "No"
```

After scaffolding completes, navigate into your project:

```bash
cd hexa-grayscale
pnpm install
```

You now have:

- `src/background/` for background context classes
- `src/content/` for page logic and content scripts
- `ui/popup/` for React popup managed by HexaJS

## Step 2: Wire content lifecycle directly

In `src/content/content.ts`, keep lifecycle and page-toggle logic in the content class.

```ts
import { OnInit, OnDestroy } from '@hexajs-dev/common';
import { Content, ContentRunAt, InjectView } from '@hexajs-dev/core';
import { GrayscaleToggleView } from './ui/grayscale-toggle/grayscale-toggle-view';

const HEXA_GRAYSCALE_CLASS = 'hexa-grayscale-enabled';
const HEXA_GRAYSCALE_STYLE_ID = 'hexa-grayscale-page-style';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class HexaGrayscaleContent implements OnInit, OnDestroy {
  @InjectView() grayscaleToggleView!: GrayscaleToggleView;

  private enabled = false;

  onInit(): void {
    this.ensurePageStyle();
    if (!this.grayscaleToggleView.isMounted) {
      this.grayscaleToggleView.mount();
    }
    this.grayscaleToggleView.setEnabled(this.enabled);
    this.grayscaleToggleView.setOnToggle((nextEnabled: boolean) => {
      this.setEnabled(nextEnabled);
    });
  }

  onDestroy(): void {
    this.grayscaleToggleView.setOnToggle(undefined);
    if (this.grayscaleToggleView.isMounted) {
      this.grayscaleToggleView.unmount();
    }
    this.removePageStyle();
    document.documentElement.classList.remove(HEXA_GRAYSCALE_CLASS);
    this.enabled = false;
  }

  private setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    document.documentElement.classList.toggle(HEXA_GRAYSCALE_CLASS, enabled);
    this.grayscaleToggleView.setEnabled(enabled);
  }

  private ensurePageStyle(): void {
    if (document.getElementById(HEXA_GRAYSCALE_STYLE_ID)) {
      return;
    }
    const styleElement = document.createElement('style');
    styleElement.id = HEXA_GRAYSCALE_STYLE_ID;
    styleElement.textContent = `html.${HEXA_GRAYSCALE_CLASS} { filter: grayscale(100%); }`;
    document.head.appendChild(styleElement);
  }

  private removePageStyle(): void {
    document.getElementById(HEXA_GRAYSCALE_STYLE_ID)?.remove();
  }
}
```

Why this is important:

- `onInit` mounts the view and wires the toggle callback.
- `onDestroy` guarantees cleanup when content unloads.
- Keeping this first version local makes the beginner flow easier to follow.

## Step 3 (Optional): Add a logger service to learn DI

This step is optional. Your extension already works without it.

Create `src/content/services/logger.service.ts`:

```ts
import { Injectable, InjectableContext } from '@hexajs-dev/common';

const LOGGER_PREFIX = '[hexa-grayscale]';

@Injectable({ context: InjectableContext.Content })
export class LoggerService {
  log(message: string, data?: unknown): void {
    if (typeof data === 'undefined') {
      console.log(`${LOGGER_PREFIX} ${message}`);
      return;
    }
    console.log(`${LOGGER_PREFIX} ${message}`, data);
  }

  logState(enabled: boolean): void {
    this.log('Current grayscale state', { enabled });
  }
}
```

Then inject it in `src/content/content.ts`:

```ts
import { LoggerService } from './services/logger.service';

@Content({ matches: ['<all_urls>'], runAt: ContentRunAt.DocumentIdle })
export class HexaGrayscaleContent implements OnInit, OnDestroy {
  constructor(private readonly logger: LoggerService) {}

  onInit(): void {
    // existing setup logic
    this.logger.log('Content script initialized on', window.location.href);
    this.logger.logState(this.enabled);
  }

  onDestroy(): void {
    // existing cleanup logic
    this.logger.logState(this.enabled);
    this.logger.log('Content script destroyed');
  }

  private setEnabled(enabled: boolean): void {
    // existing toggle logic
    this.logger.logState(enabled);
  }
}
```

If you skip this optional step, remove the logger import, constructor dependency, and logger calls.

## Step 4: Build the view controller with `@View`

Create `src/content/ui/grayscale-toggle/grayscale-toggle-view.ts`.

First, create a CSS file `src/content/ui/grayscale-toggle/grayscale-toggle.css`:

```css
:host {
  all: initial;
}

.hexa-grayscale-toggle {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483646;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  border-radius: 999px;
  box-shadow: 0 10px 26px rgba(2, 6, 23, 0.25);
  height: 44px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.hexa-grayscale-toggle:hover {
  background: #f9fafb;
}

.hexa-grayscale-toggle:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
}

.hexa-grayscale-toggle__icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
}

.hexa-grayscale-toggle__icon svg {
  width: 100%;
  height: 100%;
}

.hexa-grayscale-toggle__label {
  white-space: nowrap;
}
```

Then create the view controller:

```ts
import { HexaView, View } from '@hexajs-dev/core';
import { GrayscaleToggleComponent } from './grayscale-toggle.component';
import styles from './grayscale-toggle.css?inline';

interface GrayscaleToggleState {
  enabled: boolean;
}

type ToggleListener = () => void;
type ToggleHandler = (enabled: boolean) => void;

@View({
  id: 'hexa-grayscale-toggle',
  component: GrayscaleToggleComponent,
  styles,
  anchorSelector: 'body'
})
export class GrayscaleToggleView extends HexaView {
  private listeners = new Set<ToggleListener>();
  private onToggle?: ToggleHandler;
  private state: GrayscaleToggleState = { enabled: false };

  subscribe(listener: ToggleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): GrayscaleToggleState {
    return this.state;
  }

  setEnabled(enabled: boolean): void {
    this.setState({ enabled });
  }

  setOnToggle(onToggle?: ToggleHandler): void {
    this.onToggle = onToggle;
  }

  toggle = (): void => {
    this.onToggle?.(!this.state.enabled);
  };

  private setState(nextState: GrayscaleToggleState): void {
    this.state = nextState;
    this.listeners.forEach((listener) => listener());
  }
}
```

Key points:

- Import CSS via `import styles from './file.css?inline'` (Vite syntax).
- The `styles` variable is passed to `@View` decorator.
- Styles are scoped to shadow DOM by HexaView.

## Step 5: Build the React view component

Create `src/content/ui/grayscale-toggle/grayscale-toggle.component.tsx`.

The component subscribes to `HexaView` state via `useSyncExternalStore` and displays eye icons:

```tsx
import React, { useSyncExternalStore } from 'react';
import { GrayscaleToggleView } from './grayscale-toggle-view';

interface GrayscaleToggleComponentProps {
  controller: GrayscaleToggleView;
}

function EyeOpenIcon(): JSX.Element {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path fill='currentColor' d='M12 6.25c4.09 0 7.36 2.5 8.85 5.75c-1.49 3.25-4.76 5.75-8.85 5.75S4.64 15.25 3.15 12C4.64 8.75 7.91 6.25 12 6.25zm0 1.5c-3.31 0-6.02 1.96-7.35 4.25c1.33 2.29 4.04 4.25 7.35 4.25s6.02-1.96 7.35-4.25c-1.33-2.29-4.04-4.25-7.35-4.25zm0 1.75a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5z' />
    </svg>
  );
}

function EyeClosedIcon(): JSX.Element {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path fill='currentColor' d='M3.78 4.84L2.72 5.9l3.11 3.11A11.81 11.81 0 0 0 2.9 12c1.7 3.43 5.15 5.75 9.1 5.75c1.66 0 3.23-.41 4.62-1.14l3.76 3.76l1.06-1.06L3.78 4.84zm8.22 3.41c3.31 0 6.02 1.96 7.35 4.25a9.38 9.38 0 0 1-3.73 3.69l-1.24-1.24a3.99 3.99 0 0 0-5.32-5.32L7.8 8.37a9.06 9.06 0 0 1 4.2-1.12zm-.04 3.26l2.53 2.53A2.5 2.5 0 0 1 9.46 9.1l2.5 2.41z' />
    </svg>
  );
}

export function GrayscaleToggleComponent({ controller }: GrayscaleToggleComponentProps): JSX.Element {
  const state = useSyncExternalStore(
    (onStoreChange) => controller.subscribe(onStoreChange),
    () => controller.getSnapshot()
  );

  const iconLabel = state.enabled ? 'Disable grayscale' : 'Enable grayscale';

  return (
    <button
      type='button'
      className='hexa-grayscale-toggle'
      onClick={controller.toggle}
      aria-label={iconLabel}
      title={iconLabel}
    >
      <span className='hexa-grayscale-toggle__icon'>
        {state.enabled ? <EyeClosedIcon /> : <EyeOpenIcon />}
      </span>
      <span className='hexa-grayscale-toggle__label'>{state.enabled ? 'On' : 'Off'}</span>
    </button>
  );
}
```

Key points:

- `useSyncExternalStore` keeps component in sync with `HexaView` state.
- Eye icons change based on `state.enabled`.
- Button includes accessible labels via `aria-label` and `title`.

## Step 6: Keep handler and background minimal

For this minimal extension, all feature behavior stays in content.

- `src/content/handler.ts` can remain empty for now.
- `src/background/controller.ts` can remain a stub until you need cross-context messaging.

This is intentional. Avoid complexity until a real requirement appears.

## Step 7: Validate the behavior manually

Use two different tabs.

Checklist:

1. Eye button appears in both tabs.
2. Toggling in tab A does not toggle tab B automatically.
3. Reloading the page does not duplicate the button.
4. Unloading content removes mounted UI cleanly.

## Troubleshooting

### Toggle appears but page does not turn grayscale

- Verify class is applied to `document.documentElement`.
- Verify the style element is present in `document.head`.

### Toggle duplicates after navigation

- Ensure `onDestroy()` calls `unmount()` and removes page style.
- Ensure `onInit()` checks `isMounted` before calling `mount()`.

### Styling collides with website CSS

- Keep button styles inside `@View` shadow styles.
- Avoid using page-level selectors for button UI.

## What to build next

After this tutorial you can add:

- Persistence with storage ports
- Popup-to-background messaging
- Per-domain grayscale defaults
- Keyboard shortcut toggle

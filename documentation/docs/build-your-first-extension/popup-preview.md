---
title: Designing Popup
sidebar_position: 3
description: Build a managed popup that demonstrates HexaJS UI-context DI with token and service injection.
---

# Designing Popup

In this step, build a popup that stays lightweight but clearly shows HexaJS UI dependency injection in action.

## What we want from this popup

- Keep feature behavior in content/background.
- Use popup as a UI surface that reads DI-provided context values.
- Demonstrate token + service injection in the UI context.

## Keep popup managed

Your `hexa-cli.config.json` should include:

```json
{
  "ui": {
    "popup": {
      "mode": "managed",
      "sourceDir": "ui/popup",
      "indexFile": "index.html"
    }
  }
}
```

## Add a popup UI service (DI)

Create `ui/popup/src/services/popup-context.service.ts`:

```ts
import { Inject, Injectable, HexaContext, createToken, HEXA_BUILD_MODE, HEXA_PLATFORM } from '@hexajs-dev/common';
import { RuntimePort } from '@hexajs-dev/ports';

export const POPUP_TITLE = createToken('POPUP_TITLE', 'Hexa Grayscale', HexaContext.UI);

export interface PopupContextViewModel {
  title: string;
  platform: string;
  mode: string;
  runtimeRoot: string;
}

@Injectable({ context: HexaContext.UI })
export class PopupContextService {
  constructor(@Inject(POPUP_TITLE) private readonly title: string,
    @Inject(HEXA_PLATFORM) private readonly platform: string,
    @Inject(HEXA_BUILD_MODE) private readonly mode: string,
    private readonly runtimePort: RuntimePort) {}

  getViewModel(): PopupContextViewModel {
    return {
      title: this.title,
      platform: this.platform,
      mode: this.mode,
      runtimeRoot: this.runtimePort.getURL(''),
    };
  }
}
```

## Use DI service in App

Update `ui/popup/src/App.tsx`:

```tsx
import { inject } from '@hexajs-dev/common';
import { PopupContextService } from './services/popup-context.service';

export function App() {
  const popupContext = inject(PopupContextService);
  const vm = popupContext.getViewModel();

  return (
    <div className='popup-root'>
      <header className='popup-header'>
        <p className='popup-kicker'>HexaJS Managed Popup</p>
        <h1>{vm.title}</h1>
        <p className='popup-subtitle'>UI context is active with DI</p>
      </header>

      <main className='popup-content'>
        <div className='popup-card'>
          <span>Platform</span>
          <strong>{vm.platform}</strong>
        </div>
        <div className='popup-card'>
          <span>Mode</span>
          <strong>{vm.mode}</strong>
        </div>
        <div className='popup-card'>
          <span>Runtime root</span>
          <strong className='mono'>{vm.runtimeRoot}</strong>
        </div>
        <p className='popup-note'>
          This popup does not own feature state. It renders DI-driven context and can later call background actions with HexaUIClient.
        </p>
      </main>
    </div>
  );
}
```

## Popup styling

Create `ui/popup/src/style.css`:

```css
* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  width: 320px;
}

body {
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  background: radial-gradient(circle at 20% 20%, #e0f2fe 0%, #f8fafc 50%, #eef2ff 100%);
  color: #0f172a;
}

.popup-root {
  width: 320px;
  min-height: 420px;
  border: 1px solid #dbe4ff;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.popup-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 65%, #0ea5e9 100%);
  color: #f8fafc;
  padding: 18px 16px 16px;
}

.popup-kicker {
  margin: 0;
  font-size: 11px;
  opacity: 0.82;
  letter-spacing: 0.75px;
  text-transform: uppercase;
}

.popup-header h1 {
  margin: 8px 0 4px;
  font-size: 22px;
  line-height: 1.15;
}

.popup-subtitle {
  margin: 0;
  font-size: 12.5px;
  opacity: 0.88;
}

.popup-content {
  padding: 16px;
  display: grid;
  gap: 10px;
}

.popup-card {
  border: 1px solid #dbe4ff;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.popup-card span {
  margin: 0;
  font-size: 12px;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.55px;
}

.popup-card strong {
  font-size: 12px;
  color: #0f172a;
}

.mono {
  font-family: 'IBM Plex Mono', Consolas, monospace;
  max-width: 150px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-note {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #334155;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 10px 12px;
}
```

## Optional: override popup token from config

You can override `POPUP_TITLE` in `hexa-cli.config.json`:

```json
{
  "environments": {
    "development": {
      "tokens": [
        { "key": "POPUP_TITLE", "value": "Hexa Grayscale (Dev)", "context": "ui" }
      ]
    }
  }
}
```

This lets you change popup labels per mode/platform without hardcoding values in UI components.

## Why this popup design works

- It proves DI is available in managed popup UI.
- It keeps business logic outside the popup.
- It gives you a clean base for adding typed UI-to-background messaging next.

When you are ready, inject `HexaUIClient` in the same service layer and call background actions without changing your component DI pattern.

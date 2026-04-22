---
title: Designing Popup
sidebar_position: 3
description: Build a simple managed popup that mirrors the grayscale feature visually without controlling page state.
---

# Designing Popup

In this tutorial, the popup is intentionally visual-only.

That gives you a clean first extension architecture:

- Content owns the feature behavior.
- Popup demonstrates UI composition and packaging.

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

## Minimal popup component

The popup is visual-only and displays a simple header and message:

```tsx
import { useState } from 'react';

export function App() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className='popup-root'>
      <header className='popup-header'>
        <p className='popup-kicker'>Hexa Grayscale</p>
        <h1>HexaJS Framework</h1>
        <p className='popup-subtitle'>Toggle from the page eye icon</p>
      </header>

      <main className='popup-content'>
        <div className='eye-preview'>
          <div>
            <p className='eye-preview__text'>This popup is visual only. Use the floating eye icon on each page.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
```

## Popup styling

Create `ui/popup/src/style.css` with the following styles:

```css
* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, sans-serif;
  background: #f4f4f5;
  color: #111827;
}

.popup-root {
  width: 320px;
  background: #f9fafb;
}

.popup-header {
  background: linear-gradient(160deg, #18181b 0%, #3f3f46 100%);
  color: #ffffff;
  padding: 18px 16px;
}

.popup-kicker {
  margin: 0;
  font-size: 11px;
  opacity: 0.72;
  letter-spacing: 0.7px;
  text-transform: uppercase;
}

.popup-header h1 {
  margin: 6px 0 2px;
  font-size: 20px;
  line-height: 1.2;
}

.popup-subtitle {
  margin: 0;
  font-size: 12.5px;
  opacity: 0.82;
}

.popup-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.eye-preview {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px;
}

.eye-preview__text {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #4b5563;
}
```

Key styling features:

- **Popup width**: `320px` — compact popup size
- **Header gradient**: Dark gradient (`#18181b` to `#3f3f46`) for visual hierarchy
- **Content area**: Light background (`#f9fafb`) with padding
- **Card styling**: White bordered card with rounded corners for the preview section
- **Typography**: System fonts with carefully tuned sizes for readability

## Why popup is visual-only

For this minimal extension, the popup serves as a simple UI shell:

- All feature logic lives in content (per-tab control).
- Popup provides branding and instructions.
- No cross-context messaging complexity.

When you are ready to add persistence or background coordination, you can add `HexaUIClient` messaging and move state into background.

## Design guidance

For this specific example:

- Use a clean header with project branding.
- Include a single, clear message about how to use the extension.
- Avoid state toggles or complex interactions in the popup.
- Let the content-side eye icon be the primary interaction point.

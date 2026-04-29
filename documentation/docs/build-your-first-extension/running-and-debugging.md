---
title: Running and Debugging
sidebar_position: 4
description: Build the grayscale extension for Chrome and validate behavior in real tabs.
---

# Running and Debugging

This page covers the shortest path from source code to a running extension.

## Build for Chrome (development)

From your project folder (after running `hexa new`):

```bash
pnpm run dev:chrome
```

This runs:

```bash
hexa build --platform chrome --watch
```

This command watches for changes and rebuilds automatically. The output appears in `dist/chrome/development`.

## Load unpacked extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select your project's `dist/chrome/development` folder
5. The extension should appear in your extension list
6. Refresh to see live changes during `dev:chrome`

## Verify in browser tabs

Open at least two websites and validate:

1. Floating eye button appears on each page.
2. Clicking eye toggles grayscale for that page.
3. Reload does not duplicate the floating button.
4. Popup opens and displays the visual preview layout.

## Production build

When ready to test a production build:

```bash
pnpm run build:chrome
```

Output path: `dist/chrome/production`

You can load this into Chrome similarly, but production builds are optimized and minified.

## Optional multi-browser commands

```bash
pnpm run build:firefox
pnpm run build:safari
pnpm run build:edge
pnpm run build:brave
pnpm run build:opera
```

## Common issues

### Build succeeds but no eye icon appears

- Confirm content class uses `@Content({ matches: ['<all_urls>'] })`.
- Confirm `onInit()` mounts the view and wires the toggle callback.

### Eye icon appears but no grayscale effect

- Check `document.documentElement` class toggle logic.
- Check that the page-level style element is inserted.

### UI duplicates

- Confirm `onDestroy()` unmounts the view.
- Confirm style element and class are removed in `onDestroy()`.

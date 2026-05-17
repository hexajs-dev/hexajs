---
title: First Steps
sidebar_position: 3
description: Load your scaffolded HexaJS extension into a browser and make your first change.
---

# First Steps

After scaffolding your project, the next step is to run watch mode and load the extension into your browser.

## Run the dev server

When you scaffold with `hexa new`, HexaJS generates platform scripts in `package.json` for each selected platform:

- `dev:<platform>` -> `hexa build --platform <platform> --watch`
- `build:<platform>` -> `hexa build --platform <platform>`
- `production:<platform>` -> `hexa build --platform <platform> --mode production`

You can run watch mode using either path:

### Option A: Generated script

```bash
npm run dev:chrome
```

If you chose a different package manager, use its equivalent script command (for example `pnpm dev:chrome`, `yarn dev:chrome`, or `bun run dev:chrome`).

### Option B: Direct CLI command

```bash
hexa build --platform chrome --watch
```

If you selected more platforms during scaffolding, matching scripts are generated too (for example `dev:firefox`, `dev:safari`, and others).

This will watch for changes in your source files and automatically reload the extension's background script, content scripts, and UI.

For Chrome projects, watch mode also launches a Chromium-compatible browser automatically with your extension loaded from `dist/chrome/development`.

Hexa opens `chrome://extensions` in the generated dev profile so you can immediately confirm extension loading state.

When a compatible Chromium or Chrome for Testing binary is available, Hexa prefers that over branded Google Chrome because current Google Chrome builds block command-line unpacked extension loading.

Hexa also pre-seeds the extension action as pinned in the generated dev profile.

If the extension is not visible, enable **Developer mode** there and refresh once.

If you want to disable that behavior, run watch mode with:

```bash
hexa build --platform chrome --watch --no-auto-open-browser
```

For full watch-mode behavior by browser and runtime context, see the [HMR guide](/docs/cli-tooling/hmr).

## Load in Chrome

If auto-launch succeeds, your extension is already loaded and this section is optional. Use these steps when auto-launch is disabled or unavailable.

1.  Open your Chrome browser and navigate to `chrome://extensions`.
2.  Ensure that **Developer mode** is enabled using the toggle switch in the top-right corner.
3.  Click on the **Load unpacked** button.
4.  In the file selection dialog, navigate to your project's `dist/chrome/development` folder and select it.

Your extension should now be loaded and active.

## Project structure overview

The scaffolded project structure depends on the options you choose in `hexa new`, but this base layout is always present:

```
hexa-extension/
  package.json
  tsconfig.json
  hexa-cli.config.json
  src/
    assets/
      hexa-logo.svg
    background/
      main.ts
      controller.ts
    content/
      content.ts
      handler.ts
  ui/
    popup/
      index.html
```

Optional generated parts:

- Full template adds store, services, and contract starter files under `src/background/store`, `src/content/store`, `src/services`, and `src/contract`.
- React popup option adds `ui/popup/src`, `ui/popup/vite.config.ts`, and `ui/popup/tsconfig.json`.
- DevTools option adds `ui/devtools` files (fallback HTML or React setup, depending on your choices).

Now you are ready to start building your extension!

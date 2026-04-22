---
title: First Steps
sidebar_position: 3
description: Load your scaffolded HexaJS extension into a browser and make your first change.
---

# First Steps

After scaffolding your project and installing the dependencies, the next step is to run the development server and load the extension into your browser.

## Run the dev server

To start the development server with Hot Module Reloading (HMR), run:

```bash
hexa build --platform chrome --mode development --watch
```

This will watch for changes in your source files and automatically reload the extension's background script, content scripts, and UI.

## Load in Chrome

1.  Open your Chrome browser and navigate to `chrome://extensions`.
2.  Ensure that **Developer mode** is enabled using the toggle switch in the top-right corner.
3.  Click on the **Load unpacked** button.
4.  In the file selection dialog, navigate to your project's `dist/chrome/development` folder and select it.

Your extension should now be loaded and active.

## Project structure overview

The generated project has a specific structure to organize your code logically:

```
hexa-extension/
  src/
    background/     ← background service worker and logic
    content/        ← content scripts that run in web pages
    services/       ← shared injectable services for reuse
  ui/
    popup/          ← managed React popup UI
  hexa-cli.config.json ← HexaJS configuration file
```

Now you are ready to start building your extension!

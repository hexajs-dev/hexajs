---
title: Managed UI
sidebar_position: 1
description: Build popup and devtools surfaces with DI, tokens, and HexaUIClient using the managed UI pipeline.
---

# Managed UI

> **Target Audience:** Intermediate
> **Goal:** Build extension UI surfaces with DI + messaging while keeping state ownership in background/content stores.

Managed UI configures popup/devtools/newtab build + bootstrap for you. The CLI wires a UI DI container, registers tokens, and exposes `HexaUIClient` for typed messaging to background.

For advanced injected rendering patterns, this section also covers Shadow Views, where a HexaJS view extends `HexaView`, gets injected with `@InjectView()`, and mounts React into an isolated Shadow DOM root.

## What Managed UI supports

- UI-scoped and general DI services.
- Token injection through the generated UI container.
- `HexaUIClient` request/response messaging.
- React or Vue bindings (project-wide), via `@hexajs-dev/ui/react` and `@hexajs-dev/ui/vue`.
- Shadow Views for isolated Shadow DOM rendering.

## Choosing a framework

Set `ui.framework` in `hexa-cli.config.json` to either `"react"` (default) or `"vue"`. The choice applies to all managed surfaces (popup, devtools, newtab) and the content `@View` shadow DOM. Mixing React and Vue per surface is not supported.

```json
{
  "ui": {
    "framework": "vue",
    "popup": { "mode": "managed", "sourceDir": "ui/popup", "indexFile": "index.html" }
  }
}
```

See [React Integration](./react-integration) and [Vue Integration](./vue-integration) for the framework-specific patterns.

## What Managed UI does not host

- No `@State(...)` UI store registration.
- No `HexaBackgroundStore` or `HexaContentStore` in UI context.
- No controller/handler endpoints in UI context.

When UI needs data, ask background through messaging and let state live in background/content store contexts.

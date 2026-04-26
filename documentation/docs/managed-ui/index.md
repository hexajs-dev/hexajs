---
title: Managed UI
sidebar_position: 1
description: Build popup and devtools surfaces with DI, tokens, and HexaUIClient using the managed UI pipeline.
---

# Managed UI

> **Target Audience:** Intermediate
> **Goal:** Build extension UI surfaces with DI + messaging while keeping state ownership in background/content stores.

Managed UI configures popup/devtools build + bootstrap for you. The CLI wires a UI DI container, registers tokens, and exposes `HexaUIClient` for typed messaging to background.

For advanced injected rendering patterns, this section also covers Shadow Views, where a HexaJS view extends `HexaView`, gets injected with `@InjectView()`, and mounts React into an isolated Shadow DOM root.

## What Managed UI supports

- UI-scoped and general DI services.
- Token injection through the generated UI container.
- `HexaUIClient` request/response messaging.
- React bindings from `@hexajs-dev/ui/react`.
- Shadow Views for isolated Shadow DOM rendering.

## What Managed UI does not host

- No `@State(...)` UI store registration.
- No `HexaBackgroundStore` or `HexaContentStore` in UI context.
- No controller/handler endpoints in UI context.

When UI needs data, ask background through messaging and let state live in background/content store contexts.

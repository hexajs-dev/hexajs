---
title: Browser-Agnostic Messaging
sidebar_position: 1
description: Build messaging flows on top of ports and platform-aware abstractions instead of direct browser API calls.
---

# Browser-Agnostic Messaging

> **Target Audience:** Advanced
> **Goal:** Route messages through typed clients and ports while keeping code browser-agnostic.

HexaJS standardizes communication across Background, Content, and UI contexts through client and port abstractions.

## Core principles

- Never call `chrome.*` / `browser.*` directly in app classes.
- Use `@hexajs-dev/ports` and injected clients.
- Route request/response messages through background endpoints.
- Keep code platform-agnostic; CLI builds per target platform.

## What you'll learn

- How clients route messages across context boundaries.
- How `RuntimePort` and other ports hide browser API differences.
- How to implement custom ports with platform switch logic.
- How background acts as the router between UI/content contexts.

> **Platform build behavior:** Platform-aware ports use `__HEXA_PLATFORM__` for tree-shaking. See [Build Pipeline](../cli-tooling/build-pipeline.md#tree-shaking-and-platform-branches) for details.

## API reference

For exhaustive built-in ports documentation, see [API Reference](../api-reference/index.md).

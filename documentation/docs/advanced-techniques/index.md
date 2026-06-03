---
title: Advanced Techniques
sidebar_position: 1
description: Cross-cutting recipes for production HexaJS extensions — state sync, reactive pipelines, worker streaming, validated contracts, and environment-aware configuration.
---

# Advanced Techniques

> **Target Audience:** Advanced
> **Goal:** Compose HexaJS primitives into robust, production-ready patterns across context boundaries.

Core Fundamentals and State Management teach you the individual building blocks. This section is about combining them.

Each recipe here represents a pattern that shows up repeatedly in real extensions — one that is obvious in isolation but requires care at the seams between contexts, stores, workers, and the build system.

## Prerequisites

You should be comfortable with the following before working through these recipes:

- [Core Fundamentals](../core-fundamentals/index.md) — DI, controllers, handlers, tokens, workers, validation pipes
- [State Management](../state-management/index.md) — store setup, actions, reducers, effects, selectors
- [Browser-Agnostic Messaging](../browser-agnostic-messaging/index.md) — ports, message routing
- [CLI & Tooling](../cli-tooling/index.md) — build output, build pipeline, token overrides

## Example apps

These recipes are grounded in two fully buildable reference extensions. Source is available at [github.com/hexajs-dev/examples](https://github.com/hexajs-dev/examples).

**clip-volt** — A clipboard manager. Demonstrates cross-context state sync, reactive content pipelines (effects + selectors), typed broadcast contracts, and environment-aware token configuration.

**smart-clipper** — A screen-capture OCR tool. Demonstrates DOM-environment workers, streaming progress events (`emitWorkerEvent`/`withWorkerEvents`), worker-to-worker injection, and fully validated request/response DTOs.

## Recipes in this section

### [Cross-Context State Sync](./cross-context-state-sync.md)
Background owns the source of truth. Content mirrors it. How to keep both stores coherent using broadcast, runtime sync, and `*Synced` actions — without races on initial load.

### [Reactive Content Pipelines](./reactive-content-pipelines.md)
Advanced effect composition in the content store. Use `ofType` + `withLatestFrom` + selectors to derive filtered state from multiple upstream actions without polluting reducers.

### [Worker Streaming Pipelines](./worker-streaming-pipelines.md)
Run CPU-heavy logic in a `@Worker` with `WorkerEnvironment.DOM`. Stream intermediate progress back to the host using `emitWorkerEvent` and intercept it with `withWorkerEvents`. Understand lazy boot and the offscreen document lifecycle.

### [Typed Contracts and Validation](./typed-contracts-and-validation.md)
Design validated DTO contracts for controller actions, broadcast handles, and devtools messages. Use `@IsString`/`@IsNumber`/`@IsOptional` for AOT-generated route validators and build request/response/broadcast message sets that stay coherent as the extension grows.

### [Environment-Aware Configuration](./environment-aware-config.md)
Use `createToken` to declare injectable config defaults in source, then override them per environment and platform in `hexa-cli.config.json`. Combine with platform-aware ports and `__HEXA_PLATFORM__` tree-shaking to produce lean, per-target builds.

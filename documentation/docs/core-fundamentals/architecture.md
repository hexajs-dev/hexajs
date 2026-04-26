---
title: Architecture
sidebar_position: 2
description: Understand the layered architecture that HexaJS uses to organise browser extension code.
---

import BackgroundDecoratorsAPI from '../reference-models/core/background/controller/decorators.md';
import ContentDecoratorsAPI from '../reference-models/core/content/decorators.md';

# Architecture

HexaJS separates extension code into three isolated runtime contexts, each with its own DI container and lifecycle.

## Runtime Contexts

| Context | Entry Decorator | Typical Role | Can Host State |
|---------|-----------------|--------------|----------------|
| **Background** | `@Background()` | Owns orchestration, actions, and browser capabilities through ports | Yes (`@State` with `InjectableContext.Background`) |
| **Content** | `@Content(...)` | Runs per matching page, reacts to background messages, can read/update DOM | Yes (`@State` with `InjectableContext.Content`) |
| **Managed UI** | UI bootstrap generated from config | Popup/DevTools UI and user interactions | No `@State` entry today |

Each context runs with its own generated bootstrap and isolated DI container. A service that is valid in one context is not automatically valid in another.

## Decorator Roles

HexaJS uses multiple decorator groups, each with a specific responsibility:

- Entry decorators: `@Background()` and `@Content(...)` define runtime entry classes.
- Message endpoint decorators:
     - Background side: `@Controller({ namespace })` with `@Action('name')` or `@On('event')`
  - Content side: `@Handler({ namespace, Contents })` with `@Handle('name')` or `@Subscribe('event')`
- DI decorators: `@Injectable({ context })` and `@Inject(...)`
- Store decorators: `@State(...)`, `@Reducer()`, and `@Reduce(...)`

## AOT Context Awareness

HexaJS build is context-aware at compile time:

1. Scan phase reads decorators and token declarations (`@Injectable`, `@Background`, `@Content`, `@Controller`, `@Handler`, `@State`, `createToken`).
2. Validate phase enforces context boundaries (for example, content handlers cannot inject background-only services).
3. Generate phase emits per-context bootstrap files that register services, handlers/controllers, ports, and tokens.

This is why runtime code stays clean: you write decorators and constructor dependencies, while the AOT pipeline wires context-safe bootstrap code.

## Layered packages

```
@hexajs-dev/common   ← DI container, decorators, tokens (no hexa deps)
     ↑
@hexajs-dev/ports    ← platform abstractions (Chrome / Firefox APIs)
     ↑
@hexajs-dev/core     ← controllers, handlers, store, clients
     ↑
@hexajs-dev/cli      ← build pipeline, manifest patching, scaffold
```

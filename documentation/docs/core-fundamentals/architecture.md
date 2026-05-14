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
| **Background** | `@Background()` | Owns orchestration, actions, and browser capabilities through ports | Yes (`@State` with `HexaContext.Background`) |
| **Content** | `@Content(...)` | Runs per matching page, reacts to background messages, can read/update DOM | Yes (`@State` with `HexaContext.Content`) |
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

The HexaJS CLI (`@hexajs-dev/cli`) powers the Ahead-of-Time compilation pipeline. It analyzes the TypeScript Abstract Syntax Tree (AST) to understand your architecture before any bundling happens. The CLI pipeline is broken into three major phases:

1. **Scan Phase (`cli/src/compiler`)**: The scanner walks the codebase to discover and catalog decorators (`@Injectable`, `@Background`, `@Content`, `@Controller`, `@Handler`, `@State`) and token declarations. It registers them into an internal semantic registry, grouping them by their target context.
2. **Analysis Phase (`cli/src/analyzer`)**: The analyzer acts as a boundary enforcement engine. It verifies correct usage and identifies cross-context violations (e.g., preventing a content script handler from injecting a service that requires background-only browser APIs). It analyzes the DI graph, stores/effects, and manifest configurations.
3. **Generate Phase (`cli/src/generators`)**: Based on the validated registry, the generator emits tightly scoped, context-specific bootstrap files. These files efficiently wire up DI containers, ports, controllers, handlers, and stores for the Background and Content scripts.

Finally, the CLI drives the underlying bundler (Vite/Esbuild via `bundler.ts`) and sets up specialized HMR (`hmr/`) for extension environments. This is why runtime code stays clean: you write declarative decorators, while the AOT pipeline wires context-safe bootstrap code.

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

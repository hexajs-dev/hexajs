---
title: Core Fundamentals
sidebar_position: 1
description: Understand HexaJS architecture — DI, Controllers, Decorators, and Tokens.
---

# Core Fundamentals

> **Target Audience:** Intermediate
> **Goal:** Understand the framework's architecture — DI, Controllers, Handlers, Decorators, and Tokens.

HexaJS brings a structured, decorator-driven architecture to browser extension development. By utilizing established dependency injection (DI) patterns, it provides a predictable way to manage the complex, multi-context environment of modern web extensions.

If you are familiar with enterprise-grade TypeScript frameworks, the core concepts here will feel natural. Instead of relying on manual message-passing and global state, HexaJS organizes your extension logic into modular, testable, and highly cohesive classes.

## The Architecture at a Glance

Browser extensions inherently run in isolated environments (e.g., Background Service Workers, Content Scripts, Popups). HexaJS manages this complexity using a unified architectural approach:

* **Dependency Injection (DI):** The engine that instantiates classes and resolves their dependencies. It manages the lifecycle and singletons of your services across different extension contexts.
* **Controllers & Handlers:** Classes responsible for routing messages and browser events. Background scripts use Controllers to expose actions, while Content scripts use Handlers to react to them.
* **Services:** Plain TypeScript classes decorated with `@Injectable()`, containing your core business logic, API calls, or state logic.

## What you'll learn in this section

This section covers the foundational building blocks of a HexaJS application:

- **Context Boundaries:** How the DI container operates across isolated `Background`, `Content`, and `UI` environments.
- **Lifecycle Boundaries:** Where to initialize and clean up subscriptions (`onInit`/`onDestroy`) per context.
- **Services (`@Injectable`):** Writing your first injectable service to encapsulate reusable logic.
- **Controllers (`@Controller` & `@Action`):** Declaring background controllers to handle structured incoming messages.
- **Handlers (`@Handler` & `@Handle`):** Declaring content-side message endpoints and subscriptions.
- **Message Routing:** Understanding how typed `namespace:action` routes travel between UI, content, and background contexts.
- **Workers (`@Worker`):** Structuring dedicated worker runtimes for CPU-heavy pipelines and background processing isolation.
- **Validation Pipes:** Enforcing DTO payload and response shape checks through AOT-generated route validators.
- **Custom Tokens:** Creating and binding custom injection `Tokens` for configuration values or third-party libraries.
- **State Management (`@Reducer`):** How the `@Reducer` decorator integrates your class methods directly with the framework's state store.

## Core Docs in This Section

- [Architecture](./architecture)
- [Dependency Injection](./dependency-injection)
- [Controllers & Actions](./controllers)
- [Handlers & Handle](./handlers)
- [Decorators & Tokens](./tokens)
- [Message Routing](./message-routing)
- [Validation Pipes](./validation-pipes)
- [Workers](./workers)
- [State Management](../state-management/)
---
title: Philosophy
sidebar_position: 1
description: Why HexaJS exists and why browser extensions need application architecture, not ad-hoc scripts.
---

# Thinking in HexaJS

For a long time, building a browser extension has felt like writing a quick script. Add a `manifest.json`, register a background listener, touch the DOM from a content script, and ship.

That is a great way to start. It is a poor way to scale.

Once an extension spans Background, Content, Popup, DevTools, permissions, storage, workers, and multiple browsers, it stops behaving like a script. It becomes a distributed client application running across isolated runtimes.

HexaJS was built for that moment.

## Extensions are software systems

Modern browser extensions handle authentication, orchestration, persistent state, background processing, DOM automation, cross-context messaging, and increasingly rich user interfaces. They deserve the same architectural rigor that teams already expect in serious frontend and backend applications.

HexaJS brings that rigor to the extension world. It does not try to make extensions look like websites. It gives them an application model that fits the platform they actually run on.

## The problem with the default extension model

The WebExtensions platform gives you powerful primitives, but very little structure. That freedom is convenient on day one and expensive by day one hundred.

Common failure modes appear quickly:

- Messages become stringly-typed routes and `switch` statements.
- Payload contracts drift across context boundaries.
- Shared logic gets duplicated because each runtime context is isolated.
- State ends up scattered between background memory, storage, and UI-local assumptions.
- Browser differences leak into business logic.
- Testing becomes painful because behavior is tightly coupled to browser globals.

This is not a discipline problem. It is an architecture problem.

## What HexaJS believes

### 1. Maintainability is worth the upfront cost

HexaJS is intentionally opinionated. It introduces decorators, tokens, context rules, and an Ahead-of-Time build pipeline. That is more ceremony than writing a vanilla extension by hand.

The trade-off is deliberate. HexaJS optimizes less for "the fastest hello world" and more for "the codebase you can still reason about six months later."

### 2. Contexts are boundaries, not folders

Background, Content, and UI are not just directories in a project. They are separate execution environments with different capabilities, lifecycles, and constraints.

HexaJS treats them that way. Code is analyzed, bundled, and bootstrapped for the context where it actually belongs. Background orchestration should not accidentally pull in UI rendering code. Content scripts should stay narrow and explicit. The architecture should reflect the runtime.

### 3. Contracts should be visible to the framework

HexaJS favors explicit contracts over ambient conventions.

`@Controller` classes define background entry points. Content handlers define content-side behavior. Tokens make dependencies intentional. Validation pipes protect transport boundaries. The AOT pipeline scans these declarations and generates the wiring needed to keep them coherent.

The point is simple: when data crosses a boundary, the framework should know what that boundary means before runtime.

### 4. Platform complexity belongs below the application layer

Your business logic should not be full of vendor-specific browser branches, manifest quirks, or permission bookkeeping.

HexaJS pushes that complexity downward into a browser-agnostic ports layer, platform-aware builds, manifest patching, and compile-time analysis. Application code should express behavior. The framework should carry the extension-specific infrastructure burden.

### 5. UI is a surface, not the architecture

A popup or devtools page may be the visible part of the extension, but it is rarely the whole system. Real extensions coordinate background logic, content scripts, storage, workers, and UI together.

HexaJS does not center the entire framework around the popup. It treats UI as one runtime participant inside a larger, context-aware application model.

## Why the build is part of the architecture

HexaJS is not only a runtime library. The build pipeline is part of the design.

The CLI scans decorators and tokens, validates context boundaries, generates bootstrap code, emits validation artifacts, assembles context-specific outputs, and produces platform-specific extension builds. In HexaJS, architecture is not just a convention your team promises to follow. It is something the toolchain can inspect and enforce.

## Who HexaJS is for

If you are building a small experiment, a one-off automation, or a weekend utility, HexaJS may be more framework than you need.

But if you are building an extension that must scale across features, support multiple browsers, survive refactors, and be maintained by a team over time, that is exactly where HexaJS is meant to live.

HexaJS exists for the moment an extension stops being "just a script" and starts becoming software.
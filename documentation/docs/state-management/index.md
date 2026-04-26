---
title: State Management
sidebar_position: 1
description: Build predictable extension state with actions, reducers, and reactive selectors across Background and Content contexts.
---

# State Management

> **Target Audience:** Intermediate
> **Goal:** Model state changes with explicit actions and reducers, then consume state safely through RxJS selectors.

HexaJS state management is decorator-driven and context-aware. You can host state in both Background and Content contexts using `@State(...)`, while the UI context remains messaging-only.

The recommended workflow is:

1. Define actions with `createAction(...)` and optional `props<...>()` payload typing.
2. Implement reducer classes with `@Reducer()` and `@Reduce(...)` methods.
3. Add effect classes with `createEffect(...)` when reactive side effects or async orchestration are needed.
4. Register reducer slices in a `@State(...)` config.
5. Inject `HexaBackgroundStore<T>` or `HexaContentStore<T>` and use `dispatch(...)` + `pipe(select(...))`.

This section is aligned with the real runtime behavior in `@hexajs-dev/core` and generation/validation in `@hexajs-dev/cli`.

## What you'll learn

- How store setup works in both Background and Content contexts.
- How to design typed actions and dispatch them from controllers/handlers.
- How reducer methods are connected to action types.
- How effects react to action streams and dispatch follow-up actions.
- How `store.pipe(select(...))` reduces noisy subscriptions.
- Which CLI commands scaffold reducer/state files.
- Why Managed UI does not host store state directly.

## Related implementation references

- `packages/core/src/store/store.abstract.ts`
- `packages/core/src/store/action.abstract.ts`
- `packages/core/src/store/decorators.ts`
- `packages/core/src/store/effect.ts`
- `packages/cli/src/bin/programs/generate.ts`
- `packages/cli/src/compiler/store/reducer/scanner.ts`

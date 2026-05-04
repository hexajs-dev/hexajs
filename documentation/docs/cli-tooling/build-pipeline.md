---
title: Build Pipeline
sidebar_position: 3
description: Understand AOT compilation flow, context attribution, and runtime validation guarantees.
---

# Build Pipeline

HexaJS build is AOT-first. The CLI scans metadata before runtime and emits context-specific artifacts.

## Pipeline overview

1. Scan source metadata for decorated classes and methods.
2. Analyze dependency graph and propagate context usage.
3. Generate context bootstraps for background, content, and managed UI.
4. Generate route validators for payload and response DTOs.
5. Bundle context outputs and patch manifest.

## AOT guarantees

- Route handlers are discovered before runtime.
- DTO validators are generated per route.
- Invalid payloads can be rejected before business logic runs.
- Context map constrains rebuilds and validation to relevant areas.

## Tree shaking and platform branches

Platform-aware ports use `__HEXA_PLATFORM__` as a compile-time constant and `HEXA_PLATFORM` as a token fallback. The bundler can statically eliminate dead branches for each target platform, keeping each build output lean and free of unused platform code.

## Context map and runtime safety

Hexa builds a context map from source imports and root context entry points.

Why it matters:
- Change detection can rebuild only affected contexts.
- Validation routing can remain context-aware.
- Build output is deterministic for each target context.

## Generated validation behavior

Build emits validation pipes that map routes to generated validators.

- Inbound request validation: payload shape checks.
- Outbound response validation: optional response DTO checks.
- Error shape includes validation failure codes.

## What users should care about

- Stronger runtime safety without hand-writing validators.
- Faster watch cycles through context-scoped rebuilds.
- Predictable output across browser targets.

## Related pages

- Commands and targets: [CLI Commands](./cli-commands.md)
- Output merge behavior: [Manifest Patching](./manifest-patching.md)
- Watch mode and reload behavior: [HMR](./hmr.md)
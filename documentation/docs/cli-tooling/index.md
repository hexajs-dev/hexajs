---
title: CLI & Tooling
sidebar_position: 1
description: Build, validate, patch, and hot-reload HexaJS extensions with a predictable CLI workflow.
---

# CLI & Tooling

The Hexa CLI drives project scaffolding, AOT compilation, manifest generation, and live development workflows.

## What this section covers

- Command reference for day-to-day workflows.
- How AOT build produces context-safe runtime artifacts.
- How manifest patching merges user manifest safely.
- How HMR behaves per platform and per context.

## Recommended path

1. Start with [CLI Commands](./cli-commands.md) to learn command surface.
2. Read [Build Pipeline](./build-pipeline.md) to understand AOT and validation.
3. Read [Manifest Patching](./manifest-patching.md) to understand what Hexa overrides.
4. Read [HMR](./hmr.md) for platform-specific behavior and fallbacks.
5. Use [API Reference](../api-reference/index.md) for built-in ports details.

## Principles

- One command surface, multiple output contexts.
- Context-aware generation with AOT metadata.
- Safe defaults with explicit override boundaries.
- Change-scoped HMR where platform supports it.
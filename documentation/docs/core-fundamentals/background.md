---
title: Background
sidebar_position: 3
description: Define background entry classes and understand when to keep one or many.
---

import BackgroundDecoratorsAPI from '../reference-models/core/background/decorators.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Background

The background context is the extension orchestration runtime. In HexaJS, a class marked with `@Background()` is treated as a startup entry for that runtime.

## Minimal Example

```ts
import { Background } from '@hexajs-dev/core';
import { OnDestroy, OnInit } from '@hexajs-dev/common';

@Background()
export class MainBackground implements OnInit, OnDestroy {
  onInit(): void {
    // Register listeners, warm caches, and start background workflows.
  }

  onDestroy(): void {
    // Clean up subscriptions or timers.
  }
}
```

## Multi-Background Restriction (CLI Default)

HexaJS CLI intentionally protects the common one-background setup:

- `hexa add background <name>` fails if a `@Background` class already exists.
- Use `hexa add background <name> --allow-multiple` only when you explicitly want more entries.

Important nuance:

- Build generation can initialize multiple `@Background` classes.
- They still run in the same background runtime and DI container, not in isolated background processes.

Practical recommendation: keep one main background entry for lifecycle startup, then split business logic into services and controllers.

## Related Docs

- Controllers and action routes: [Controllers & Actions](./controllers)
- Context boundaries: [Architecture](./architecture)

<ApiReferenceAppendix>
<BackgroundDecoratorsAPI />
</ApiReferenceAppendix>
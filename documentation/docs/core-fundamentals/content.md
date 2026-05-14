---
title: Content
sidebar_position: 4
description: Define content entries for one or many sites, and scope handlers to the right content classes.
---

import ContentDecoratorsAPI from '../reference-models/core/content/decorators.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Content

Content entries are page-injected runtime classes. Each `@Content(...)` class describes where and when code is injected.

## Minimal Example

```ts
import { Content, ContentRunAt } from '@hexajs-dev/core';
import { OnDestroy, OnInit } from '@hexajs-dev/common';

@Content({
  matches: ['https://example.com/*'],
  runAt: ContentRunAt.DocumentIdle,
})
export class ExampleContent implements OnInit, OnDestroy {
  onInit(): void {
    // DOM integration starts here.
  }

  onDestroy(): void {
    // Remove listeners and observers.
  }
}
```

## Multi-Content For Multi-Site Extensions

Use multiple content classes when your extension targets multiple sites or page families:

- One class can target one set of URL patterns.
- Another class can target a different site or pattern set.
- The CLI groups content entries by `matches`, `runAt`, and `allFrames`, then generates content bundles per group.

This gives clean separation for site-specific logic while preserving shared services and DI.

## runAt Quick Guide

- `ContentRunAt.DocumentStart`: as early as possible before DOM is fully built.
- `ContentRunAt.DocumentEnd`: after DOM is parsed.
- `ContentRunAt.DocumentIdle`: browser-chosen safe point after load-critical work. This is the CLI default (`document-idle`).

If unsure, start with `DocumentIdle` and move earlier only when you need pre-render hooks.

## Handlers Are Content-Scoped

Handlers are content-context endpoints and should be bound intentionally:

```ts
import { Handle, Handler } from '@hexajs-dev/core';
import { ExampleContent } from './example.content';

@Handler({ namespace: 'capture', Contents: [ExampleContent] })
export class CaptureHandler {
  @Handle('run')
  run(payload: unknown): { ok: true } {
    return { ok: true };
  }
}
```

Guidance:

- Use `Contents: [MyContentClass]` to scope handler registration to specific content entries.
- `Contents: []` means the handler is available in all generated content bundles.
- Handlers can inject content or general services only. Background or UI service injection is rejected during analysis.

## Related Docs

- Handler details and route patterns: [Handlers](./handlers)
- Overall context model: [Architecture](./architecture)

<ApiReferenceAppendix>
<ContentDecoratorsAPI />
</ApiReferenceAppendix>
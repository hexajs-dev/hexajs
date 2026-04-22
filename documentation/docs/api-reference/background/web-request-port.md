---
title: WebRequestPort
description: API reference for WebRequestPort in the background context.
---

import WebRequestPortAPI from '../../reference-models/ports/background/web-request/web-request-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# WebRequestPort

`WebRequestPort` intercepts and observes network requests at each lifecycle stage, providing read access to request and response details in Manifest V3 contexts.

:::warning MV3 Limitation
Blocking request modification is not supported in MV3. Use [`DeclarativeNetRequestPort`](./declarative-net-request-port.md) to redirect or block requests declaratively.
:::

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/web-request/web-request.port.ts`

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <WebRequestPortAPI />
</ApiReferenceAppendix>
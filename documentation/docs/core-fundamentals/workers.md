---
title: Workers
sidebar_position: 8
description: Advanced patterns for @Worker in HexaJS, including lifecycle, routing, and high-throughput task design.
---

# Workers

> **Target Audience:** Advanced
> **Goal:** Build robust worker pipelines with predictable lifecycle, message boundaries, and performance characteristics.

HexaJS workers let you isolate CPU-heavy or latency-sensitive logic from your primary runtime surfaces (background, content, and UI). Workers are declared with `@Worker({ ... })` and can be wired into background services or other workers via `@InjectWorker()` properties.

## Why Workers Matter

Modern browser extensions already split code across multiple contexts. Without a worker strategy, heavy workloads often leak into background or UI orchestration and create slow responses, dropped events, or unpredictable latency spikes.

A good worker design gives you:

- **Isolation:** expensive operations run outside controller/handler orchestration paths.
- **Backpressure control:** bounded queues prevent memory spikes during burst traffic.
- **Clear contracts:** typed request/response envelopes keep execution predictable.
- **Operational visibility:** worker-level timing and failure telemetry become first-class.

## Runtime Model

At a high level, workers in HexaJS fit this flow:

1. A controller/handler receives a typed command.
2. The command is mapped to a worker operation contract.
3. The worker executes with a bounded deadline and structured error mapping.
4. The result is returned as a typed response DTO.

Use the same design principles as any distributed boundary: explicit contracts, timeout policy, retry policy, and idempotency.

## Lazy boot behavior

Worker registration is lazy from the caller's perspective.

- The generated bootstrap registers worker proxies during container setup.
- The underlying worker host is not started at registration time.
- HexaJS boots the worker host on the first method call made through that proxy.

This means unused workers do not pay startup cost, but the first call to a worker may include a one-time boot penalty before the method executes.

## Recommended Contract Shape

Use a strict message envelope for worker requests and responses.

```ts
export interface WorkerRequest<TPayload> {
  requestId: string;
  operation: string;
  payload: TPayload;
  issuedAt: number;
  timeoutMs: number;
}

export interface WorkerSuccess<TData> {
  ok: true;
  requestId: string;
  data: TData;
  durationMs: number;
}

export interface WorkerFailure {
  ok: false;
  requestId: string;
  errorCode: string;
  message: string;
  durationMs: number;
}

export type WorkerResponse<TData> = WorkerSuccess<TData> | WorkerFailure;
```

This shape ensures observability and deterministic caller behavior.

## Example: OCR Normalization Worker

### 1. Worker-facing DTOs

```ts
export class NormalizeOcrRequest {
  text!: string;
  language!: string;
}

export class NormalizeOcrResponse {
  normalized!: string;
  confidence!: number;
}
```

### 2. Worker class

```ts
import { InjectWorker } from '@hexajs-dev/common';
import { Worker } from '@hexajs-dev/core';

@Worker({ name: 'ocr-normalizer', environment: 'compute' })
export class OcrNormalizationWorker {
  async normalize(payload: NormalizeOcrRequest): Promise<NormalizeOcrResponse> {
    const cleaned = payload.text.replace(/\s+/g, ' ').trim();

    return {
      normalized: cleaned,
      confidence: cleaned.length > 0 ? 0.98 : 0,
    };
  }
}

@Worker({ name: 'ocr-pipeline', environment: 'compute' })
export class OcrPipelineWorker {
  @InjectWorker()
  private normalizer!: OcrNormalizationWorker;

  async run(payload: NormalizeOcrRequest): Promise<NormalizeOcrResponse> {
    return this.normalizer.normalize(payload);
  }
}
```

If you need to resolve a worker lazily at runtime instead of declaring a property, use `injectWorker(WorkerClass)` from `@hexajs-dev/common`.

### 3. Controller integration

```ts
import { Controller, Action } from '@hexajs-dev/core';
import { OcrPipelineWorker } from '../workers/ocr-pipeline.worker';
import { NormalizeOcrRequest, NormalizeOcrResponse } from '../dto/ocr-normalize.dto';

@Controller({ namespace: 'ocr' })
export class OcrController {
  constructor(private readonly worker: OcrPipelineWorker) {}

  @Action('normalize')
  async normalize(payload: NormalizeOcrRequest): Promise<NormalizeOcrResponse> {
    return this.worker.run(payload);
  }
}
```

## Lifecycle Strategy

Workers should be treated as lifecycle-aware services.

- Initialize caches and lookup tables lazily, not in constructor hot path.
- Expose explicit shutdown cleanup if you hold handles (timers, streams, open channels).
- Avoid hidden global state; keep deterministic state transitions so rebuild/reload behavior remains stable.

For long-running tasks, use chunking with cooperative yielding to avoid starvation.

```ts
for (let i = 0; i < chunks.length; i++) {
  processChunk(chunks[i]);
  if (i % 10 === 0) {
    await Promise.resolve();
  }
}
```

## Throughput and Backpressure

For advanced workloads, place a queue in front of worker execution.

- Use a bounded queue size.
- Reject early when queue is saturated.
- Track queue depth and operation latency.
- Make retries explicit and operation-specific.

A practical policy set:

- High-priority interaction tasks: timeout 2-5s, no retry.
- Bulk indexing: timeout 15-30s, retry once.
- Best-effort enrichment: timeout 5-10s, drop on overload.

## Error Taxonomy

Avoid returning raw exception strings directly to callers.

Map worker failures into stable error codes:

- `WORKER_TIMEOUT`
- `WORKER_OVERLOADED`
- `WORKER_VALIDATION_FAILED`
- `WORKER_EXECUTION_FAILED`

This allows controller/handler callers to implement deterministic UX behavior.

## Advanced Testing Checklist

1. Contract tests for every operation request/response shape.
2. Timeout tests for long-running inputs.
3. Saturation tests (queue limits and rejection behavior).
4. Idempotency tests for retry-capable operations.
5. Hot-reload tests ensuring worker state re-initializes correctly.

## Design Guidelines

- Keep worker APIs coarse-grained; avoid chatty micro-calls.
- Keep payloads serializable and minimal.
- Keep operation names versionable (`ocr.normalize.v1`) for long-lived contracts.
- Keep worker logic pure where possible; isolate side effects at boundaries.
- Keep worker-to-worker injection explicit with `@InjectWorker()` properties or `injectWorker(WorkerClass)` when you need on-demand resolution.

## Related Reading

- [Dependency Injection](./dependency-injection)
- [Controllers & Actions](./controllers)
- [Message Routing](./message-routing)
- [Validation Pipes](./validation-pipes)

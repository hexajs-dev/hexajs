---
title: Worker Streaming Pipelines
sidebar_position: 4
description: Run canvas-based image processing in a DOM-environment worker, stream stage progress back to the host with emitWorkerEvent and withWorkerEvents, and understand lazy boot and offscreen document behavior.
---

# Worker Streaming Pipelines

> **Target Audience:** Advanced
> **Goal:** Build a worker pipeline that executes canvas image processing and streams intermediate stage events back to background service code using HexaJS worker events.

Long-running operations — image processing, format conversion, thumbnail generation, data transformation — belong in workers. But callers often need intermediate signals while waiting for the final result: which stage is running, how far along it is, whether a step failed.

HexaJS provides a clean two-sided API for this: `emitWorkerEvent` inside the worker, `withWorkerEvents` on the proxy in the host.

This recipe uses image processing (crop, resize, thumbnail) as the scenario — canvas and `OffscreenCanvas` require a DOM-capable environment, making this a representative real-world case for `WorkerEnvironment.DOM`.

## Concepts: two environments

Workers in HexaJS run in one of two environments, set via `@Worker({ environment })`:

| Environment | Value | Use when |
|---|---|---|
| `WorkerEnvironment.Compute` | `'compute'` | Pure CPU work, no DOM access needed. Runs in a Web Worker. |
| `WorkerEnvironment.DOM` | `'dom'` | Needs `canvas`, `createImageBitmap`, `fetch`, or other DOM APIs. On Chromium, runs via an offscreen document. |

The choice is invisible to callers — the proxy surface is identical either way. The transport engine handles the wiring.

## The scenario

An extension captures a screenshot of the active tab, then needs to:

1. Crop it to a user-selected rectangle.
2. Resize to a maximum dimension.
3. Generate a small thumbnail for the UI.

All three steps use `OffscreenCanvas` and `createImageBitmap` — they cannot run in a plain service-worker context. They go in a `WorkerEnvironment.DOM` worker.

## 1. Contracts

```ts
// src/contract/messages.ts
import { IsNumber, IsString, IsOptional } from '@hexajs-dev/common';

export class ImageProcessRequest {
  @IsString()  imageDataUrl: string;
  @IsNumber()  cropX:        number;
  @IsNumber()  cropY:        number;
  @IsNumber()  cropWidth:    number;
  @IsNumber()  cropHeight:   number;
  @IsNumber()  maxDimension: number;
  @IsOptional() @IsNumber() viewportWidth?:  number;
  @IsOptional() @IsNumber() viewportHeight?: number;
}

export class ImageProcessResult {
  @IsString() processedDataUrl: string;
  @IsString() thumbnailDataUrl: string;
  @IsNumber() outputWidth:      number;
  @IsNumber() outputHeight:     number;
  @IsNumber() durationMs:       number;
}

export class ImageProcessProgressMessage {
  @IsString() stage:    string; // 'crop' | 'resize' | 'thumbnail'
  @IsNumber() progress: number; // 0-100
}
```

## 2. The worker

```ts
// src/background/workers/image-processor.worker.ts
import { Worker, WorkerEnvironment, emitWorkerEvent } from '@hexajs-dev/core';
import { ImageProcessRequest, ImageProcessResult } from '../../contract/messages';

@Worker({ name: 'image-processor', environment: WorkerEnvironment.DOM })
export class ImageProcessorWorker {
  async process(req: ImageProcessRequest): Promise<ImageProcessResult> {
    const start = Date.now();

    // Stage 1: decode source image
    emitWorkerEvent('image-process-progress', { stage: 'crop', progress: 0 });
    const sourceBlob  = await dataUrlToBlob(req.imageDataUrl);
    const sourceBitmap = await createImageBitmap(sourceBlob);

    // Stage 2: crop to selection, accounting for viewport scale
    const scaleX = req.viewportWidth  ? sourceBitmap.width  / req.viewportWidth  : 1;
    const scaleY = req.viewportHeight ? sourceBitmap.height / req.viewportHeight : 1;
    const sx = Math.max(0, Math.floor(req.cropX      * scaleX));
    const sy = Math.max(0, Math.floor(req.cropY      * scaleY));
    const sw = Math.min(sourceBitmap.width  - sx, Math.ceil(req.cropWidth  * scaleX));
    const sh = Math.min(sourceBitmap.height - sy, Math.ceil(req.cropHeight * scaleY));

    const cropCanvas  = new OffscreenCanvas(sw, sh);
    const cropCtx     = cropCanvas.getContext('2d')!;
    cropCtx.drawImage(sourceBitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    sourceBitmap.close();
    emitWorkerEvent('image-process-progress', { stage: 'crop', progress: 100 });

    // Stage 3: resize to maxDimension
    emitWorkerEvent('image-process-progress', { stage: 'resize', progress: 0 });
    const scale      = Math.min(1, req.maxDimension / Math.max(sw, sh));
    const outW       = Math.round(sw * scale);
    const outH       = Math.round(sh * scale);
    const resizeCanvas = new OffscreenCanvas(outW, outH);
    const resizeCtx  = resizeCanvas.getContext('2d')!;
    const cropBitmap = await createImageBitmap(cropCanvas);
    resizeCtx.drawImage(cropBitmap, 0, 0, outW, outH);
    cropBitmap.close();
    emitWorkerEvent('image-process-progress', { stage: 'resize', progress: 100 });

    // Stage 4: thumbnail (capped at 120px)
    emitWorkerEvent('image-process-progress', { stage: 'thumbnail', progress: 0 });
    const thumbScale  = Math.min(1, 120 / Math.max(outW, outH));
    const thumbW      = Math.round(outW * thumbScale);
    const thumbH      = Math.round(outH * thumbScale);
    const thumbCanvas = new OffscreenCanvas(thumbW, thumbH);
    const thumbCtx    = thumbCanvas.getContext('2d')!;
    const resizedBitmap = await createImageBitmap(resizeCanvas);
    thumbCtx.drawImage(resizedBitmap, 0, 0, thumbW, thumbH);
    resizedBitmap.close();
    emitWorkerEvent('image-process-progress', { stage: 'thumbnail', progress: 100 });

    const [processedBlob, thumbnailBlob] = await Promise.all([
      resizeCanvas.convertToBlob({ type: 'image/png' }),
      thumbCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.75 }),
    ]);

    return {
      processedDataUrl: await blobToDataUrl(processedBlob),
      thumbnailDataUrl: await blobToDataUrl(thumbnailBlob),
      outputWidth:      outW,
      outputHeight:     outH,
      durationMs:       Date.now() - start,
    };
  }
}

// Utilities — kept outside the class since they don't need worker state
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const [meta, payload] = dataUrl.split(',');
  const mime    = meta.replace('data:', '').replace(';base64', '');
  const binary  = atob(payload);
  const bytes   = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf    = await blob.arrayBuffer();
  const bytes  = new Uint8Array(buf);
  let binary   = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:${blob.type};base64,${btoa(binary)}`;
}
```

`emitWorkerEvent(eventType, data?)` fires a `WorkerCallEvent` back to the host during the currently executing method call. It is a no-op if called outside an active HexaJS-tracked worker call.

The full `WorkerCallEvent` shape:

```ts
interface WorkerCallEvent<T = unknown> {
  callId:     string;  // identifies the in-flight call
  workerName: string;  // matches @Worker({ name })
  eventType:  string;  // application-defined, e.g. 'image-process-progress'
  data?:      T;       // optional typed payload
}
```

## 3. Background service: @InjectWorker + withWorkerEvents

```ts
// src/background/services/image-processing.service.ts
import { Injectable, HexaContext, InjectWorker } from '@hexajs-dev/common';
import { withWorkerEvents, WorkerCallEvent } from '@hexajs-dev/core';
import { ImageProcessorWorker } from '../workers/image-processor.worker';
import { ImageProcessRequest, ImageProcessResult } from '../../contract/messages';

export interface ProcessProgress { stage: string; progress: number; }

@Injectable({ context: HexaContext.Background })
export class ImageProcessingService {
  @InjectWorker() private imageWorker!: ImageProcessorWorker;

  async process(req: ImageProcessRequest, onProgress?: (p: ProcessProgress) => void): Promise<ImageProcessResult> {
    const worker = withWorkerEvents(this.imageWorker, (event: WorkerCallEvent) => {
      if (event.eventType !== 'image-process-progress' || !onProgress) return;
      const data = event.data as { stage?: unknown; progress?: unknown };
      if (typeof data?.stage !== 'string' || typeof data?.progress !== 'number') return;
      onProgress({ stage: data.stage, progress: data.progress });
    });

    return worker.process(req);
  }
}
```

`withWorkerEvents(workerProxy, onEvent)` returns a new proxy bound to that listener. The original `this.imageWorker` proxy is unchanged — each call gets its own bound proxy with its own handler.

## 4. Controller: process + stream progress to content

```ts
// src/background/controller.ts
import { Controller, Action, HexaBackgroundClient } from '@hexajs-dev/core';
import { ImageProcessingService } from './services/image-processing.service';
import { ImageProcessRequest, ImageProcessResult, ImageProcessProgressMessage } from '../../contract/messages';

@Controller({ namespace: 'image' })
export class ImageController {
  constructor(private readonly imageService: ImageProcessingService, private readonly client: HexaBackgroundClient) {}

  @Action('process')
  async onProcess(payload: ImageProcessRequest & { tabId: number }): Promise<ImageProcessResult> {
    return this.imageService.process(payload, (p) => {
      this.client
        .sendToTab(payload.tabId, 'image:progress', new ImageProcessProgressMessage(p.stage, p.progress))
        .catch(() => {});
    });
  }
}
```

## Lazy boot and the first-call penalty

Workers are not started at container bootstrap time. The proxy is registered during DI setup, but the host (offscreen document or Web Worker) is only booted on the first method call.

On Chromium with `WorkerEnvironment.DOM`, that first call:
1. Checks whether the offscreen document exists (`chrome.offscreen.hasDocument()`).
2. Creates it if missing (`chrome.offscreen.createDocument(...)`).
3. Sets up the runtime message relay.
4. Executes the method.

The offscreen document creation can take 100–500ms. Subsequent calls reuse the running host with no boot penalty.

Warm the worker during `onInit` if first-call latency matters:

```ts
// src/background/main.ts
async onInit(): Promise<void> {
  // Warm the worker at a quiet moment so the first real call is instant
  this.imageService.process({ imageDataUrl: '', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1, maxDimension: 1 }).catch(() => {});
}
```

## Worker-to-worker injection

Workers can depend on other workers. Use `@InjectWorker()` on a property:

```ts
@Worker({ name: 'image-pipeline', environment: WorkerEnvironment.Compute })
export class ImagePipelineWorker {
  @InjectWorker() private processor!: ImageProcessorWorker;

  async run(req: ImageProcessRequest): Promise<ImageProcessResult> {
    return this.processor.process(req);
  }
}
```

For on-demand resolution inside a method, use `injectWorker(WorkerClass)` from `@hexajs-dev/common`:

```ts
import { injectWorker } from '@hexajs-dev/common';

async run(req: ImageProcessRequest): Promise<ImageProcessResult> {
  return injectWorker(ImageProcessorWorker).process(req);
}
```

## Error taxonomy

Map worker failures to stable codes before they surface to controllers:

```ts
export const WorkerErrorCode = {
  Timeout:          'WORKER_TIMEOUT',
  Overloaded:       'WORKER_OVERLOADED',
  ValidationFailed: 'WORKER_VALIDATION_FAILED',
  ExecutionFailed:  'WORKER_EXECUTION_FAILED',
} as const;
```

```ts
// In the service, wrap the worker call:
try {
  return await worker.process(req);
} catch (err) {
  const code = err instanceof TimeoutError ? WorkerErrorCode.Timeout : WorkerErrorCode.ExecutionFailed;
  throw new WorkerError(code, String(err));
}
```

This keeps controller/handler UX logic deterministic — callers branch on codes, not raw error strings.

## Pitfalls

- **Calling `emitWorkerEvent` outside a worker method.** It silently no-ops. It only works during an active call tracked by the HexaJS transport (`__HEXA_ACTIVE_WORKER_CALL__` must be set in globalThis).
- **Re-using a `withWorkerEvents` proxy across multiple calls.** Each `withWorkerEvents` call returns a proxy bound to one listener instance. If you make two concurrent calls through the same wrapped proxy, both calls will deliver events to the same handler. Create a fresh wrapped proxy per logical operation when concurrent calls need separate handlers.
- **DOM workers on Firefox.** Firefox has no offscreen document API. HexaJS falls back to a plain Web Worker for `WorkerEnvironment.DOM` on Firefox. `OffscreenCanvas` and `createImageBitmap` are available in Web Workers on Firefox, so canvas processing works — but extension-specific APIs (`chrome.tabs`, etc.) are not available inside a Web Worker. Keep worker code dependency-free from extension globals; pass all data as arguments.
- **Blocking the thread for large images.** For very large bitmaps, the decode and draw operations can block long enough to affect responsiveness. Yield between stages with `await Promise.resolve()` if you need cooperative multitasking.

## Related reading

- [Workers](../core-fundamentals/workers.md)
- [Dependency Injection](../core-fundamentals/dependency-injection.md)
- [Typed Contracts and Validation](./typed-contracts-and-validation.md)
- [Build Output](../cli-tooling/build-output.md) — where `worker-<name>.js` files are emitted

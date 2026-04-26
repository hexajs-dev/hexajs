---
title: IdlePort
description: API reference for IdlePort in the background context.
---

import IdlePortAPI from '../../reference-models/ports/background/idle/idle-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# IdlePort

`IdlePort` monitors and queries the user's system idle state, enabling extensions to pause background work when the user is away.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/idle/idle.port.ts`

## Key Methods

- `queryState(detectionIntervalInSeconds: number): Promise<WebExtIdleState>` - Query current idle state.
- `setDetectionInterval(intervalInSeconds: number): void` - Configure the idle detection threshold.
- `onStateChangedAddListener(listener: (newState: WebExtIdleState) => void): void` - Subscribe to state change events.
- `onStateChangedRemoveListener(listener: (newState: WebExtIdleState) => void): void` - Unsubscribe from state change events.

## Usage

```typescript
import { IdlePort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class ActivityMonitorService {
  constructor(private readonly idle: IdlePort) {}

  startMonitoring() {
    this.idle.setDetectionInterval(60);
    this.idle.onStateChangedAddListener((state) => {
      if (state === 'idle') {
        this.pauseBackgroundSync();
      } else if (state === 'active') {
        this.resumeBackgroundSync();
      }
    });
  }

  private pauseBackgroundSync() {}
  private resumeBackgroundSync() {}
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <IdlePortAPI />
</ApiReferenceAppendix>
---
title: AlarmsPort
description: API reference for AlarmsPort in the background context.
---

import AlarmsPortAPI from '../../reference-models/ports/background/alarms/alarms-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# AlarmsPort

`AlarmsPort` schedules and manages periodic or one-time background alarms that survive service worker restarts.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/alarms/alarms.port.ts`

## Key Methods

- `create(name: string, alarmInfo?: WebExtAlarmCreateInfo): void` - Schedule a new alarm.
- `get(name: string): Promise<WebExtAlarm | undefined>` - Retrieve alarm by name.
- `getAll(): Promise<WebExtAlarm[]>` - List all scheduled alarms.
- `clear(name?: string): Promise<boolean>` - Cancel a named alarm.
- `clearAll(): Promise<boolean>` - Cancel all alarms.
- `onAlarmAddListener(listener: (alarm: WebExtAlarm) => void): void` - Subscribe to alarm events.
- `onAlarmRemoveListener(listener: (alarm: WebExtAlarm) => void): void` - Unsubscribe from alarm events.

## Usage

```typescript
import { AlarmsPort } from '@hexajs/ports';
import { Injectable, InjectableContext } from '@hexajs/common';

@Injectable({ context: InjectableContext.Background })
export class DataSyncSchedulerService {
  constructor(private readonly alarms: AlarmsPort) {}

  startPeriodicSync() {
    this.alarms.create('sync', { periodInMinutes: 30 });
    this.alarms.onAlarmAddListener((alarm) => {
      if (alarm.name === 'sync') {
        this.runSync();
      }
    });
  }

  private runSync() {
    // fetch and persist remote data
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <AlarmsPortAPI />
</ApiReferenceAppendix>
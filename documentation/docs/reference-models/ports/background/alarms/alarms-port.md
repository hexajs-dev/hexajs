---
title: Alarms Port (ports)
description: Public API model reference for ports module packages/ports/src/background/alarms/alarms.port.ts.
---


### Classes

#### AlarmsPort

```ts
import { AlarmsPort } from '@hexajs-dev/ports';
```

```typescript
class AlarmsPort { ... }
```

#### Methods

**`clear()`**
```typescript
clear(name?: string): Promise<boolean>
```

**`clearAll()`**
```typescript
clearAll(): Promise<boolean>
```

**`create()`**
```typescript
create(name: string, alarmInfo?: HexaWebAlarmCreateInfo): void
```

**`get()`**
```typescript
get(name: string): Promise<HexaWebAlarm | undefined>
```

**`getAll()`**
```typescript
getAll(): Promise<HexaWebAlarm[]>
```

**`onAlarmAddListener()`**
```typescript
onAlarmAddListener(listener: (alarm: HexaWebAlarm) => void): void
```

**`onAlarmRemoveListener()`**
```typescript
onAlarmRemoveListener(listener: (alarm: HexaWebAlarm) => void): void
```


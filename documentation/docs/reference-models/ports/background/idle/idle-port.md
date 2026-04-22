---
title: Idle Port (ports)
description: Public API model reference for ports module packages/ports/src/background/idle/idle.port.ts.
---


### Classes

#### IdlePort

```ts
import { IdlePort } from '@hexajs/ports';
```

```typescript
class IdlePort { ... }
```

#### Methods

**`onStateChangedAddListener()`**
```typescript
onStateChangedAddListener(listener: (newState: HexaWebIdleState) => void): void
```

**`onStateChangedRemoveListener()`**
```typescript
onStateChangedRemoveListener(listener: (newState: HexaWebIdleState) => void): void
```

**`queryState()`**
```typescript
queryState(detectionIntervalInSeconds: number): Promise<HexaWebIdleState>
```

**`setDetectionInterval()`**
```typescript
setDetectionInterval(intervalInSeconds: number): void
```


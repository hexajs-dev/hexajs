---
title: Web Navigation Port (ports)
description: Public API model reference for ports module packages/ports/src/background/web-navigation/web-navigation.port.ts.
---


### Classes

#### WebNavigationPort

```ts
import { WebNavigationPort } from '@hexajs-dev/ports';
```

```typescript
class WebNavigationPort { ... }
```

#### Methods

**`onBeforeNavigateAddListener()`**
```typescript
onBeforeNavigateAddListener(listener: (details: any) => void, filter?: HexaWebWebNavigationEventFilter): void
```

**`onBeforeNavigateRemoveListener()`**
```typescript
onBeforeNavigateRemoveListener(listener: (details: any) => void): void
```

**`onCommittedAddListener()`**
```typescript
onCommittedAddListener(listener: (details: any) => void, filter?: HexaWebWebNavigationEventFilter): void
```

**`onCommittedRemoveListener()`**
```typescript
onCommittedRemoveListener(listener: (details: any) => void): void
```

**`onCompletedAddListener()`**
```typescript
onCompletedAddListener(listener: (details: HexaWebWebNavigationOnCompletedDetails) => void, filter?: HexaWebWebNavigationEventFilter): void
```

**`onCompletedRemoveListener()`**
```typescript
onCompletedRemoveListener(listener: (details: HexaWebWebNavigationOnCompletedDetails) => void): void
```


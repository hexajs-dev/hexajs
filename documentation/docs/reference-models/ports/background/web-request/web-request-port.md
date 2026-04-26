---
title: Web Request Port (ports)
description: Public API model reference for ports module packages/ports/src/background/web-request/web-request.port.ts.
---


### Classes

#### WebRequestPort

```ts
import { WebRequestPort } from '@hexajs-dev/ports';
```

```typescript
class WebRequestPort { ... }
```

#### Methods

**`onBeforeRequestAddListener()`**
```typescript
onBeforeRequestAddListener(listener: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void
```

**`onBeforeRequestRemoveListener()`**
```typescript
onBeforeRequestRemoveListener(listener: (details: HexaWebWebRequestDetails) => any): void
```

**`onBeforeSendHeadersAddListener()`**
```typescript
onBeforeSendHeadersAddListener(listener: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void
```

**`onBeforeSendHeadersRemoveListener()`**
```typescript
onBeforeSendHeadersRemoveListener(listener: (details: HexaWebWebRequestDetails) => any): void
```

**`onCompletedAddListener()`**
```typescript
onCompletedAddListener(listener: (details: HexaWebWebRequestDetails) => void, filter: HexaWebWebRequestFilter): void
```

**`onCompletedRemoveListener()`**
```typescript
onCompletedRemoveListener(listener: (details: HexaWebWebRequestDetails) => void): void
```

**`onErrorOccurredAddListener()`**
```typescript
onErrorOccurredAddListener(listener: (details: HexaWebWebRequestDetails) => void, filter: HexaWebWebRequestFilter): void
```

**`onErrorOccurredRemoveListener()`**
```typescript
onErrorOccurredRemoveListener(listener: (details: HexaWebWebRequestDetails) => void): void
```

**`onHeadersReceivedAddListener()`**
```typescript
onHeadersReceivedAddListener(listener: (details: HexaWebWebRequestDetails) => any, filter: HexaWebWebRequestFilter, extraInfoSpec?: HexaWebWebRequestExtraInfoSpec[]): void
```

**`onHeadersReceivedRemoveListener()`**
```typescript
onHeadersReceivedRemoveListener(listener: (details: HexaWebWebRequestDetails) => any): void
```


---
title: Extension Port (ports)
description: Public API model reference for ports module packages/ports/src/general/extension/extension.port.ts.
---


### Classes

#### ExtensionPort

```ts
import { ExtensionPort } from '@hexajs/ports';
```

```typescript
class ExtensionPort { ... }
```

#### Methods

**`getBackgroundPage()`**
```typescript
getBackgroundPage(): Window | null
```

**`getURL()`**
```typescript
getURL(path?: string): string
```

**`getViews()`**
```typescript
getViews(fetchProperties?: GetViewsFetchProperties): Window[]
```

**`isAllowedFileSchemeAccess()`**
```typescript
isAllowedFileSchemeAccess(): Promise<boolean>
```

**`isAllowedIncognitoAccess()`**
```typescript
isAllowedIncognitoAccess(): Promise<boolean>
```


### Supporting Types

#### GetViewsFetchProperties

```typescript
interface GetViewsFetchProperties {
  type?: 'tab' | 'popup' | 'background';
  windowId?: number;
}
```


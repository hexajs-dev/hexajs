---
title: Browser Action Port (ports)
description: Public API model reference for ports module packages/ports/src/background/browser-action/browser-action.port.ts.
---


### Classes

#### BrowserActionPort

```ts
import { BrowserActionPort } from '@hexajs-dev/ports';
```

```typescript
class BrowserActionPort { ... }
```

#### Methods

**`onClickedAddListener()`**
```typescript
onClickedAddListener(listener: (tab: HexaWebTab) => void): void
```

**`onClickedRemoveListener()`**
```typescript
onClickedRemoveListener(listener: (tab: HexaWebTab) => void): void
```

**`setBadgeBackgroundColor()`**
```typescript
setBadgeBackgroundColor(details: SetBadgeBackgroundColorDetails): Promise<void>
```

**`setBadgeText()`**
```typescript
setBadgeText(details: SetBadgeTextDetails): Promise<void>
```

**`setIcon()`**
```typescript
setIcon(details: SetIconDetails): Promise<void>
```

**`setTitle()`**
```typescript
setTitle(details: SetTitleDetails): Promise<void>
```


### Supporting Types

#### SetBadgeBackgroundColorDetails

```typescript
interface SetBadgeBackgroundColorDetails {
  color: string;
  tabId?: number;
}
```

#### SetBadgeTextDetails

```typescript
interface SetBadgeTextDetails {
  text: string;
  tabId?: number;
}
```

#### SetIconDetails

```typescript
interface SetIconDetails {
  path?: string | {
    [size: number]: string;
};
  tabId?: number;
  imageData?: any;
}
```

#### SetTitleDetails

```typescript
interface SetTitleDetails {
  title: string;
  tabId?: number;
}
```


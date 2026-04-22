---
title: Page Action Port (ports)
description: Public API model reference for ports module packages/ports/src/background/page-action/page-action.port.ts.
---


### Classes

#### PageActionPort

```ts
import { PageActionPort } from '@hexajs/ports';
```

```typescript
class PageActionPort { ... }
```

#### Methods

**`hide()`**
```typescript
hide(tabId: number): Promise<void>
```

**`onClickedAddListener()`**
```typescript
onClickedAddListener(listener: (tab: HexaWebTab) => void): void
```

**`onClickedRemoveListener()`**
```typescript
onClickedRemoveListener(listener: (tab: HexaWebTab) => void): void
```

**`setIcon()`**
```typescript
setIcon(details: SetIconDetails): Promise<void>
```

**`setPopup()`**
```typescript
setPopup(details: SetPopupDetails): Promise<void>
```

**`setTitle()`**
```typescript
setTitle(details: SetTitleDetails): Promise<void>
```

**`show()`**
```typescript
show(tabId: number): Promise<void>
```


### Supporting Types

#### SetIconDetails

```typescript
interface SetIconDetails {
  tabId: number;
  path?: string | {
    [size: number]: string;
};
  imageData?: any;
}
```

#### SetPopupDetails

```typescript
interface SetPopupDetails {
  tabId: number;
  popup: string;
}
```

#### SetTitleDetails

```typescript
interface SetTitleDetails {
  tabId: number;
  title?: string;
}
```


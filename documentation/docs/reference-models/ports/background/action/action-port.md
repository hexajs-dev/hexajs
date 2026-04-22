---
title: Action Port (ports)
description: Public API model reference for ports module packages/ports/src/background/action/action.port.ts.
---


### Classes

#### ActionPort

```ts
import { ActionPort } from '@hexajs/ports';
```

```typescript
class ActionPort { ... }
```

#### Methods

**`disable()`**
```typescript
disable(tabId?: number): Promise<void>
```

**`enable()`**
```typescript
enable(tabId?: number): Promise<void>
```

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

**`setPopup()`**
```typescript
setPopup(details: SetPopupDetails): Promise<void>
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

#### SetPopupDetails

```typescript
interface SetPopupDetails {
  popup: string;
  tabId?: number;
}
```

#### SetTitleDetails

```typescript
interface SetTitleDetails {
  title: string;
  tabId?: number;
}
```


---
title: Menus Port (ports)
description: Public API model reference for ports module packages/ports/src/background/menus/menus.port.ts.
---


### Classes

#### MenusPort

```ts
import { MenusPort } from '@hexajs-dev/ports';
```

```typescript
class MenusPort { ... }
```

#### Methods

**`create()`**
```typescript
create(createProperties: HexaWebMenusCreateProperties): string | number
```

**`onClickedAddListener()`**
```typescript
onClickedAddListener(listener: (info: any, tab?: HexaWebTab) => void): void
```

**`onClickedRemoveListener()`**
```typescript
onClickedRemoveListener(listener: (info: any, tab?: HexaWebTab) => void): void
```

**`remove()`**
```typescript
remove(id: string | number): Promise<void>
```

**`removeAll()`**
```typescript
removeAll(): Promise<void>
```

**`update()`**
```typescript
update(id: string | number, updateProperties: Partial<HexaWebMenusCreateProperties>): Promise<void>
```


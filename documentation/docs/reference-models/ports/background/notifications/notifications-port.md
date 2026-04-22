---
title: Notifications Port (ports)
description: Public API model reference for ports module packages/ports/src/background/notifications/notifications.port.ts.
---


### Classes

#### NotificationsPort

```ts
import { NotificationsPort } from '@hexajs/ports';
```

```typescript
class NotificationsPort { ... }
```

#### Methods

**`clear()`**
```typescript
clear(notificationId: string): Promise<boolean>
```

**`create()`**
```typescript
create(options: HexaWebNotificationOptions): Promise<string>
```

**`create()`**
```typescript
create(notificationId: string, options: HexaWebNotificationOptions): Promise<string>
```

**`create()`**
```typescript
create(notificationIdOrOptions: string | HexaWebNotificationOptions, optionsMaybe?: HexaWebNotificationOptions): Promise<string>
```

**`getAll()`**
```typescript
getAll(): Promise<{
    [notificationId: string]: boolean;
}>
```

**`onButtonClickedAddListener()`**
```typescript
onButtonClickedAddListener(listener: (notificationId: string, buttonIndex: number) => void): void
```

**`onButtonClickedRemoveListener()`**
```typescript
onButtonClickedRemoveListener(listener: (notificationId: string, buttonIndex: number) => void): void
```

**`onClickedAddListener()`**
```typescript
onClickedAddListener(listener: (notificationId: string) => void): void
```

**`onClickedRemoveListener()`**
```typescript
onClickedRemoveListener(listener: (notificationId: string) => void): void
```

**`onClosedAddListener()`**
```typescript
onClosedAddListener(listener: (notificationId: string, byUser: boolean) => void): void
```

**`onClosedRemoveListener()`**
```typescript
onClosedRemoveListener(listener: (notificationId: string, byUser: boolean) => void): void
```


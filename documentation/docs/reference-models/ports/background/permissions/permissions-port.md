---
title: Permissions Port (ports)
description: Public API model reference for ports module packages/ports/src/background/permissions/permissions.port.ts.
---


### Classes

#### PermissionsPort

```ts
import { PermissionsPort } from '@hexajs-dev/ports';
```

```typescript
class PermissionsPort { ... }
```

#### Methods

**`contains()`**
```typescript
contains(permissions: HexaWebPermissions): Promise<boolean>
```

**`getAll()`**
```typescript
getAll(): Promise<HexaWebPermissions>
```

**`onAddedAddListener()`**
```typescript
onAddedAddListener(listener: (permissions: HexaWebPermissions) => void): void
```

**`onAddedRemoveListener()`**
```typescript
onAddedRemoveListener(listener: (permissions: HexaWebPermissions) => void): void
```

**`onRemovedAddListener()`**
```typescript
onRemovedAddListener(listener: (permissions: HexaWebPermissions) => void): void
```

**`onRemovedRemoveListener()`**
```typescript
onRemovedRemoveListener(listener: (permissions: HexaWebPermissions) => void): void
```

**`remove()`**
```typescript
remove(permissions: HexaWebPermissions): Promise<boolean>
```

**`request()`**
```typescript
request(permissions: HexaWebPermissions): Promise<boolean>
```


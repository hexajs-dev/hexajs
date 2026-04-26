---
title: Management Port (ports)
description: Public API model reference for ports module packages/ports/src/background/management/management.port.ts.
---


### Classes

#### ManagementPort

```ts
import { ManagementPort } from '@hexajs-dev/ports';
```

```typescript
class ManagementPort { ... }
```

#### Methods

**`getAll()`**
```typescript
getAll(): Promise<HexaWebManagementExtensionInfo[]>
```

**`getSelf()`**
```typescript
getSelf(): Promise<HexaWebManagementExtensionInfo>
```

**`onDisabledAddListener()`**
```typescript
onDisabledAddListener(listener: (info: HexaWebManagementExtensionInfo) => void): void
```

**`onDisabledRemoveListener()`**
```typescript
onDisabledRemoveListener(listener: (info: HexaWebManagementExtensionInfo) => void): void
```

**`onEnabledAddListener()`**
```typescript
onEnabledAddListener(listener: (info: HexaWebManagementExtensionInfo) => void): void
```

**`onEnabledRemoveListener()`**
```typescript
onEnabledRemoveListener(listener: (info: HexaWebManagementExtensionInfo) => void): void
```

**`onInstalledAddListener()`**
```typescript
onInstalledAddListener(listener: (info: HexaWebManagementExtensionInfo) => void): void
```

**`onInstalledRemoveListener()`**
```typescript
onInstalledRemoveListener(listener: (info: HexaWebManagementExtensionInfo) => void): void
```

**`onUninstalledAddListener()`**
```typescript
onUninstalledAddListener(listener: (id: string) => void): void
```

**`onUninstalledRemoveListener()`**
```typescript
onUninstalledRemoveListener(listener: (id: string) => void): void
```

**`setEnabled()`**
```typescript
setEnabled(id: string, enabled: boolean): Promise<void>
```


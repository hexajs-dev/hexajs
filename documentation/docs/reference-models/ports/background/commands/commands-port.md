---
title: Commands Port (ports)
description: Public API model reference for ports module packages/ports/src/background/commands/commands.port.ts.
---


### Classes

#### CommandsPort

```ts
import { CommandsPort } from '@hexajs-dev/ports';
```

```typescript
class CommandsPort { ... }
```

#### Methods

**`getAll()`**
```typescript
getAll(): Promise<HexaWebCommand[]>
```

**`onCommandAddListener()`**
```typescript
onCommandAddListener(listener: (command: string) => void): void
```

**`onCommandRemoveListener()`**
```typescript
onCommandRemoveListener(listener: (command: string) => void): void
```


---
title: User Scripts Port (ports)
description: Public API model reference for ports module packages/ports/src/background/user-scripts/user-scripts.port.ts.
---


### Classes

#### UserScriptsPort

```ts
import { UserScriptsPort } from '@hexajs/ports';
```

```typescript
class UserScriptsPort { ... }
```

#### Methods

**`configureWorld()`**
```typescript
configureWorld(properties: ConfigureWorldProperties): Promise<void>
```

**`getScripts()`**
```typescript
getScripts(filter?: GetScriptsFilter): Promise<HexaWebUserScriptOptions[]>
```

**`register()`**
```typescript
register(scripts: HexaWebUserScriptOptions[]): Promise<void>
```

**`unregister()`**
```typescript
unregister(filter?: UnregisterFilter): Promise<void>
```


### Supporting Types

#### ConfigureWorldProperties

```typescript
interface ConfigureWorldProperties {
  csp?: string;
  messaging?: boolean;
}
```

#### GetScriptsFilter

```typescript
interface GetScriptsFilter {
  ids?: string[];
}
```

#### UnregisterFilter

```typescript
interface UnregisterFilter {
  ids?: string[];
}
```


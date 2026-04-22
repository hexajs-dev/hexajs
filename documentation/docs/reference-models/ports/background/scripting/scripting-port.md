---
title: Scripting Port (ports)
description: Public API model reference for ports module packages/ports/src/background/scripting/scripting.port.ts.
---


### Classes

#### ScriptingPort

```ts
import { ScriptingPort } from '@hexajs/ports';
```

```typescript
class ScriptingPort { ... }
```

#### Methods

**`executeScript()`**
```typescript
executeScript(options: ScriptingExecuteOptions): Promise<void>
```


### Types & Interfaces

#### ScriptingExecuteOptions

```ts
import { ScriptingExecuteOptions } from '@hexajs/ports';
```

```typescript
interface ScriptingExecuteOptions {
    target: {
        tabId: number;
        allFrames?: boolean;
    };
    files: string[];
}
```


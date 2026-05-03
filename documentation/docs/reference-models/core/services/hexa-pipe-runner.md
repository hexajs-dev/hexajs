---
title: Hexa Pipe Runner (core)
description: Public API model reference for core module packages/core/src/services/hexa-pipe-runner.ts.
---


### Classes

#### HexaPipeRunner

```ts
import { HexaPipeRunner } from '@hexajs-dev/core';
```

```typescript
class HexaPipeRunner { ... }
```

#### Methods

**`runInboundPipes()`**
```typescript
runInboundPipes(input: HexaPipeInput): Promise<unknown>
```

**`runOutboundPipes()`**
```typescript
runOutboundPipes(input: HexaPipeInput): Promise<unknown>
```

**`useOutboundPipe()`**
```typescript
useOutboundPipe(pipe: HexaPipeFn): (pipe: HexaPipeFn) => void
```

**`usePipe()`**
```typescript
usePipe(pipe: HexaPipeFn): (pipe: HexaPipeFn) => void
```


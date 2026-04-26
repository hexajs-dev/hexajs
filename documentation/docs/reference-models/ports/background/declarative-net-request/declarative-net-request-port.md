---
title: Declarative Net Request Port (ports)
description: Public API model reference for ports module packages/ports/src/background/declarative-net-request/declarative-net-request.port.ts.
---


### Classes

#### DeclarativeNetRequestPort

```ts
import { DeclarativeNetRequestPort } from '@hexajs-dev/ports';
```

```typescript
class DeclarativeNetRequestPort { ... }
```

#### Methods

**`getDynamicRules()`**
```typescript
getDynamicRules(): Promise<HexaWebDNRRule[]>
```

**`updateDynamicRules()`**
```typescript
updateDynamicRules(options: HexaWebDNRUpdateDynamicRulesOptions): Promise<void>
```


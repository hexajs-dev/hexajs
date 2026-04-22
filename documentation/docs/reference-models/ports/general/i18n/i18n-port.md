---
title: I18n Port (ports)
description: Public API model reference for ports module packages/ports/src/general/i18n/i18n.port.ts.
---


### Classes

#### I18nPort

```ts
import { I18nPort } from '@hexajs/ports';
```

```typescript
class I18nPort { ... }
```

#### Methods

**`getAcceptLanguages()`**
```typescript
getAcceptLanguages(): Promise<string[]>
```

**`getMessage()`**
```typescript
getMessage(messageName: string, substitutions?: string | string[]): string
```

**`getUILanguage()`**
```typescript
getUILanguage(): string
```


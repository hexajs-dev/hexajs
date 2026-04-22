---
title: Decorators (common)
description: Public API model reference for common module packages/common/src/di/decorators.ts.
---


#### @Injectable

```ts
import { Injectable } from '@hexajs/common';
```

```typescript
@Injectable(options?: InjectableOptions)
```


### Types & Interfaces

#### HexaTokenRef

```ts
import { HexaTokenRef } from '@hexajs/common';
```

```typescript
interface HexaTokenRef<T> {
    key: string;
    value: T;
    context?: InjectableContext;
}
```

#### InjectableOptions

```ts
import { InjectableOptions } from '@hexajs/common';
```

```typescript
interface InjectableOptions {
    context?: InjectableContext;
}
```


### Enums

#### InjectableContext

```ts
import { InjectableContext } from '@hexajs/common';
```

```typescript
enum InjectableContext {
    Empty = 'empty',
    Content = 'content',
    Background = 'background',
    UI = 'ui'
}
```


### Functions

#### createToken

```ts
import { createToken } from '@hexajs/common';
```

```typescript
function createToken<T>(key: string, value: T, context?: InjectableContext): HexaTokenRef<T>
```

#### Inject

```ts
import { Inject } from '@hexajs/common';
```

```typescript
function Inject(token: string | HexaTokenRef<any>): ParameterDecorator
```


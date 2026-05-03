---
title: Decorators (common)
description: Public API model reference for common module packages/common/src/di/decorators.ts.
---


#### @Injectable

```ts
import { Injectable } from '@hexajs-dev/common';
```

```typescript
@Injectable(options?: InjectableOptions)
```

#### @InjectWorker

```ts
import { InjectWorker } from '@hexajs-dev/common';
```

```typescript
@InjectWorker()
```


### Types & Interfaces

#### HexaTokenRef

```ts
import { HexaTokenRef } from '@hexajs-dev/common';
```

```typescript
interface HexaTokenRef<T> {
    key: string;
    value: T;
    context?: HexaContext;
}
```

#### InjectableOptions

```ts
import { InjectableOptions } from '@hexajs-dev/common';
```

```typescript
interface InjectableOptions {
    context?: HexaContext;
}
```


### Enums

#### HexaContext

```ts
import { HexaContext } from '@hexajs-dev/common';
```

```typescript
enum HexaContext {
    Empty = 'empty',
    Content = 'content',
    Background = 'background',
    UI = 'ui'
}
```


### Functions

#### createToken

```ts
import { createToken } from '@hexajs-dev/common';
```

```typescript
function createToken<T>(key: string, value: T, context?: HexaContext): HexaTokenRef<T>
```

#### Inject

```ts
import { Inject } from '@hexajs-dev/common';
```

```typescript
function Inject(token: string | HexaTokenRef<any>): ParameterDecorator
```


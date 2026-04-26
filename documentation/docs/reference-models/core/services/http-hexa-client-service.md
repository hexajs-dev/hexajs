---
title: Http Hexa Client Service (core)
description: Public API model reference for core module packages/core/src/services/http-hexa-client.service.ts.
---


### Classes

#### HttpHexaClient

```ts
import { HttpHexaClient } from '@hexajs-dev/core';
```

```typescript
class HttpHexaClient { ... }
```

#### Methods

**`delete()`**
```typescript
delete<TResponse, TBody = unknown>(url: string, options?: HttpHexaClientRequestOptions<TBody>): Observable<TResponse>
```

**`get()`**
```typescript
get<TResponse>(url: string, options?: HttpHexaClientQueryRequestOptions): Observable<TResponse>
```

**`head()`**
```typescript
head<TResponse>(url: string, options?: HttpHexaClientQueryRequestOptions): Observable<TResponse>
```

**`options()`**
```typescript
options<TResponse>(url: string, options?: HttpHexaClientQueryRequestOptions): Observable<TResponse>
```

**`patch()`**
```typescript
patch<TResponse, TBody = unknown>(url: string, body?: TBody, options?: HttpHexaClientRequestOptions<TBody>): Observable<TResponse>
```

**`post()`**
```typescript
post<TResponse, TBody = unknown>(url: string, body?: TBody, options?: HttpHexaClientRequestOptions<TBody>): Observable<TResponse>
```

**`put()`**
```typescript
put<TResponse, TBody = unknown>(url: string, body?: TBody, options?: HttpHexaClientRequestOptions<TBody>): Observable<TResponse>
```

**`request()`**
```typescript
request<TResponse>(method: HttpHexaClientMethod, url: string, options?: HttpHexaClientRequestOptions): Observable<TResponse>
```

#### HttpHexaClientError

```ts
import { HttpHexaClientError } from '@hexajs-dev/core';
```

```typescript
class HttpHexaClientError<TBody = unknown> extends Error { ... }
```


### Types & Interfaces

#### HttpHexaClientHeadersLike

```ts
import { HttpHexaClientHeadersLike } from '@hexajs-dev/core';
```

```typescript
interface HttpHexaClientHeadersLike {
    forEach?(callback: (value: string, key: string) => void): void;
    entries?(): Iterable<[
        string,
        string
    ]>;
}
```

#### HttpHexaClientRequestOptions

```ts
import { HttpHexaClientRequestOptions } from '@hexajs-dev/core';
```

```typescript
interface HttpHexaClientRequestOptions<TBody = unknown> {
    body?: TBody;
    headers?: HttpHexaClientHeaders;
    params?: HttpHexaClientParams;
    responseType?: HttpHexaClientResponseType;
    withCredentials?: boolean;
    credentials?: HttpHexaClientCredentials;
    mode?: HttpHexaClientMode;
    cache?: HttpHexaClientCache;
    redirect?: HttpHexaClientRedirect;
    referrer?: string;
    integrity?: string;
    keepalive?: boolean;
    signal?: unknown;
}
```

#### HttpHexaClientResponseLike

```ts
import { HttpHexaClientResponseLike } from '@hexajs-dev/core';
```

```typescript
interface HttpHexaClientResponseLike {
    ok: boolean;
    status: number;
    statusText: string;
    url?: string;
    headers?: HttpHexaClientHeadersLike | Record<string, string>;
    text?(): Promise<string>;
    json?(): Promise<unknown>;
    blob?(): Promise<unknown>;
    arrayBuffer?(): Promise<unknown>;
    formData?(): Promise<unknown>;
}
```

#### HttpHexaClientCache

```ts
import { HttpHexaClientCache } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientCache = 'default' | 'force-cache' | 'no-cache' | 'no-store' | 'only-if-cached' | 'reload';
```

#### HttpHexaClientCredentials

```ts
import { HttpHexaClientCredentials } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientCredentials = 'omit' | 'same-origin' | 'include';
```

#### HttpHexaClientHeaders

```ts
import { HttpHexaClientHeaders } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientHeaders = Record<string, HttpHexaClientHeaderValue>;
```

#### HttpHexaClientHeaderValue

```ts
import { HttpHexaClientHeaderValue } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientHeaderValue = HttpHexaClientPrimitive | readonly HttpHexaClientPrimitive[];
```

#### HttpHexaClientMethod

```ts
import { HttpHexaClientMethod } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
```

#### HttpHexaClientMode

```ts
import { HttpHexaClientMode } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientMode = 'cors' | 'navigate' | 'no-cors' | 'same-origin';
```

#### HttpHexaClientParams

```ts
import { HttpHexaClientParams } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientParams = Record<string, HttpHexaClientQueryValue>;
```

#### HttpHexaClientPrimitive

```ts
import { HttpHexaClientPrimitive } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientPrimitive = string | number | boolean;
```

#### HttpHexaClientQueryRequestOptions

```ts
import { HttpHexaClientQueryRequestOptions } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientQueryRequestOptions = Omit<HttpHexaClientRequestOptions, 'body'>;
```

#### HttpHexaClientQueryValue

```ts
import { HttpHexaClientQueryValue } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientQueryValue = HttpHexaClientPrimitive | readonly HttpHexaClientPrimitive[] | null | undefined;
```

#### HttpHexaClientRedirect

```ts
import { HttpHexaClientRedirect } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientRedirect = 'error' | 'follow' | 'manual';
```

#### HttpHexaClientResponseType

```ts
import { HttpHexaClientResponseType } from '@hexajs-dev/core';
```

```typescript
type HttpHexaClientResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';
```


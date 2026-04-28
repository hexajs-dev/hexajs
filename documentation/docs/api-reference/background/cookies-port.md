---
title: CookiesPort
description: API reference for CookiesPort in the background context.
---

import CookiesPortAPI from '../../reference-models/ports/background/cookies/cookies-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# CookiesPort

`CookiesPort` provides full cookie lifecycle management - reading, writing, removing, and reacting to changes - across all cookie stores.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/cookies/cookies.port.ts`

## Key Methods

- `get(details: WebExtCookiesGetDetails): Promise<WebExtCookie | null>` - Retrieve a single cookie.
- `getAll(details: WebExtCookiesGetAllDetails): Promise<WebExtCookie[]>` - Retrieve all matching cookies.
- `set(details: WebExtCookiesSetDetails): Promise<WebExtCookie | null>` - Create or overwrite a cookie.
- `remove(details: WebExtCookiesRemoveDetails): Promise<WebExtCookiesRemoveCallbackDetails>` - Delete a cookie.
- `removeAll(details: WebExtCookiesGetAllDetails): Promise<WebExtCookiesRemoveCallbackDetails[]>` - Delete all matching cookies.
- `getAllCookieStores(): Promise<WebExtCookieStore[]>` - List all available cookie stores.
- `findStoreIdByTabId(tabId: number): Promise<string | undefined>` - Resolve the cookie store for a tab.
- `onChangedAddListener(listener: CookiesChangeListener): void` - Subscribe to cookie change events.
- `onChangedRemoveListener(listener: CookiesChangeListener): void` - Unsubscribe from cookie change events.

## Usage

```typescript
import { CookiesPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class SessionCookieService {
  constructor(private readonly cookies: CookiesPort) {}

  async getAuthToken(tabId: number): Promise<string | null> {
    const storeId = await this.cookies.findStoreIdByTabId(tabId);
    const cookie = await this.cookies.get({ url: 'https://api.example.com', name: 'auth_token', storeId });
    return cookie?.value ?? null;
  }

  async clearSession(url: string) {
    await this.cookies.removeAll({ url });
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <CookiesPortAPI />
</ApiReferenceAppendix>

## Usage

```ts
import { CookiesPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class ExampleService {
  constructor(private readonly port: CookiesPort) {}
}
```

## Types & Interfaces

### WebExtCookie
Represents a browser cookie.

```typescript
interface WebExtCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expirationDate?: number;
  hostOnly: boolean;
  httpOnly: boolean;
  secure: boolean;
  session: boolean;
  storeId: string;
  sameSite?: 'no_restriction' | 'lax' | 'strict' | 'unspecified';
  firstPartyDomain?: string;
  partitionKey?: WebExtCookiePartitionKey;
}
```

### WebExtCookieStore
Represents a cookie store.

```typescript
interface WebExtCookieStore {
  id: string;
  tabIds: number[];
  incognito?: boolean;
}
```

### WebExtCookiesGetDetails
Parameters for getting a cookie.

```typescript
interface WebExtCookiesGetDetails {
  url: string;
  name: string;
  storeId?: string;
  firstPartyDomain?: string;
  partitionKey?: WebExtCookiePartitionKey;
}
```

### WebExtCookiesSetDetails
Parameters for setting a cookie.

```typescript
interface WebExtCookiesSetDetails {
  url: string;
  name?: string;
  value?: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  expirationDate?: number;
  storeId?: string;
  sameSite?: 'no_restriction' | 'lax' | 'strict' | 'unspecified';
  firstPartyDomain?: string;
  partitionKey?: WebExtCookiePartitionKey;
}
```

## Notes

- Keep platform branching inside port methods.
- Keep business logic in services/controllers, not in API wrappers.

## API Reference Appendix

<CookiesPortAPI />
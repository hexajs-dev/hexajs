---
title: Cookies Port (ports)
description: Public API model reference for ports module packages/ports/src/background/cookies/cookies.port.ts.
---


### Classes

#### CookiesPort

```ts
import { CookiesPort } from '@hexajs/ports';
```

```typescript
class CookiesPort { ... }
```

#### Methods

**`findStoreIdByTabId()`**
```typescript
findStoreIdByTabId(tabId: number): Promise<string | undefined>
```

**`get()`**
```typescript
get(details: HexaWebCookiesGetDetails): Promise<HexaWebCookie | null>
```

**`getAll()`**
```typescript
getAll(details: HexaWebCookiesGetAllDetails): Promise<HexaWebCookie[]>
```

**`getAllCookieStores()`**
```typescript
getAllCookieStores(): Promise<HexaWebCookieStore[]>
```

**`onChangedAddListener()`**
```typescript
onChangedAddListener(listener: CookiesChangeListener): void
```

**`onChangedRemoveListener()`**
```typescript
onChangedRemoveListener(listener: CookiesChangeListener): void
```

**`remove()`**
```typescript
remove(details: HexaWebCookiesRemoveDetails): Promise<HexaWebCookiesRemoveCallbackDetails>
```

**`removeAll()`**
```typescript
removeAll(details: HexaWebCookiesGetAllDetails): Promise<HexaWebCookiesRemoveCallbackDetails[]>
```

**`set()`**
```typescript
set(details: HexaWebCookiesSetDetails): Promise<HexaWebCookie | null>
```


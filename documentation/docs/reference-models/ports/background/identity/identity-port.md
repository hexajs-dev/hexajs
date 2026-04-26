---
title: Identity Port (ports)
description: Public API model reference for ports module packages/ports/src/background/identity/identity.port.ts.
---


### Classes

#### IdentityPort

```ts
import { IdentityPort } from '@hexajs-dev/ports';
```

```typescript
class IdentityPort { ... }
```

#### Methods

**`getProfileUserInfo()`**
```typescript
getProfileUserInfo(profileDetails?: GetProfileUserInfoProfileDetails): Promise<HexaWebProfileUserInfo>
```

**`getRedirectURL()`**
```typescript
getRedirectURL(path?: string): string
```

**`launchWebAuthFlow()`**
```typescript
launchWebAuthFlow(details: HexaWebIdentityLaunchWebAuthFlowDetails): Promise<string>
```


### Supporting Types

#### GetProfileUserInfoProfileDetails

```typescript
interface GetProfileUserInfoProfileDetails {
  accountStatus?: 'ANY' | 'SYNC';
}
```


---
title: IdentityPort
description: API reference for IdentityPort in the background context.
---

import IdentityPortAPI from '../../reference-models/ports/background/identity/identity-port.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# IdentityPort

`IdentityPort` handles OAuth 2.0 authentication flows and exposes the signed-in user's profile information available to the extension.

## Context

- **Availability:** Background
- **Source:** `packages/ports/src/background/identity/identity.port.ts`

## Key Methods

- `getRedirectURL(path?: string): string` - Get the extension's OAuth redirect URL.
- `launchWebAuthFlow(details: WebExtIdentityLaunchWebAuthFlowDetails): Promise<string>` - Open an interactive or silent OAuth flow.
- `getProfileUserInfo(profileDetails?: { accountStatus?: 'ANY' | 'SYNC' }): Promise<WebExtProfileUserInfo>` - Retrieve the signed-in user's email and ID.

## Usage

```typescript
import { IdentityPort } from '@hexajs-dev/ports';
import { Injectable, InjectableContext } from '@hexajs-dev/common';

@Injectable({ context: InjectableContext.Background })
export class OAuthService {
  constructor(private readonly identity: IdentityPort) {}

  async signIn(): Promise<string> {
    const redirectUrl = this.identity.getRedirectURL();
    const authUrl = `https://auth.example.com/oauth?redirect_uri=${redirectUrl}&response_type=token`;
    const responseUrl = await this.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });
    return new URL(responseUrl).hash.split('access_token=')[1];
  }
}
```

## API Reference Appendix

Below is the exhaustive, auto-generated technical reference for all types, interfaces, and signatures associated with this API.

<ApiReferenceAppendix>
  <IdentityPortAPI />
</ApiReferenceAppendix>
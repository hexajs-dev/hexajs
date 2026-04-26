---
title: Decorators & Tokens
sidebar_position: 6
description: Reference for all HexaJS decorators and how to create and bind custom injection tokens.
---

import DiDecoratorsAPI from '../reference-models/common/di/decorators.md';
import DiTokensAPI from '../reference-models/common/di/tokens.md';
import ApiReferenceAppendix from '@site/src/components/ApiReferenceAppendix';

# Decorators & Tokens

Tokens are named DI values. In HexaJS they are resolved and registered by the generated AOT bootstrap, not by manual container wiring in user code.

## Built-In System Tokens

These tokens are always created by the build foundation layer:

| Token | Type | Description |
|-------|------|-------------|
| `HEXA_PLATFORM` | `string` | Active build platform (for example `chrome`, `firefox`) |
| `HEXA_BUILD_MODE` | `string` | Active build mode (for example `development`, `production`) |

## Custom Token Defaults in Code

Use `createToken` to declare token defaults in source code.

```ts
import { createToken, Inject, Injectable, InjectableContext } from '@hexajs-dev/common';

export const API_BASE_URL = createToken('API_BASE_URL', 'https://api.example.com', InjectableContext.Background);

@Injectable({ context: InjectableContext.Background })
export class ApiConfigService {
  constructor(@Inject(API_BASE_URL) private apiBaseUrl: string) {}

  getBaseUrl(): string {
    return this.apiBaseUrl;
  }
}
```

`createToken` declarations are scanned during AOT and merged into bootstrap token registration.

## Config Token Overrides

`hexa-cli.config.json` can override tokens inside `environments`:

1. Environment `environments.<mode>.tokens`
2. Platform inside environment `environments.<mode>.platforms.<platform>.tokens`

Later layers override earlier layers by token key.

```ts
{
  "environments": {
    "development": {
      "tokens": [{ "key": "API_BASE_URL", "value": "https://dev.api.example.com" }],
      "platforms": {
        "chrome": {
          "tokens": [{ "key": "FEATURE_FLAG_X", "value": true, "context": "background" }]
        }
      }
    }
  }
}
```

## How Tokens Are Resolved

- Use constructor injection with `@Inject(TOKEN)` in application classes.
- Let AOT-generated bootstrap register token values.
- Code defaults come from `createToken(...)`, then environment and platform token overrides are applied from `hexa-cli.config.json`.
- Do not manually wire containers in application code.

## Runtime Access (Optional)

If needed, runtime code can resolve tokens with `inject(...)` after bootstrap has initialized the container:

```ts
import { inject } from '@hexajs-dev/common';

const platform = inject<string>('HEXA_PLATFORM');
```

## Important Constraints

- `createToken` scanning expects a string literal key and a static literal value.
- Token context can be omitted (general) or scoped to `background`, `content`, or `ui`.
- Build-time analyzers validate token usage alongside service dependency analysis.

<ApiReferenceAppendix>
<DiTokensAPI />
</ApiReferenceAppendix>

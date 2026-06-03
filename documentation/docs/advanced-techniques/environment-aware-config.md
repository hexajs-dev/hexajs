---
title: Environment-Aware Configuration
sidebar_position: 6
description: Use createToken defaults with hexa-cli.config.json env/platform overrides, build a ConfigService pattern, and understand __HEXA_PLATFORM__ tree-shaking for lean per-target builds.
---

# Environment-Aware Configuration

> **Target Audience:** Advanced
> **Goal:** Inject configuration values that differ per environment (dev/production) and per platform (chrome/firefox) without conditional runtime branches in application code.

Configuration should be an input to your code, not a decision your code makes at runtime. HexaJS provides two complementary tools for this: `createToken` for injectable defaults in source code, and `hexa-cli.config.json` for environment- and platform-specific overrides applied at build time.

This recipe draws from **clip-volt** ([github.com/hexajs-dev/examples](https://github.com/hexajs-dev/examples)) and from the token system covered in [Decorators & Tokens](../core-fundamentals/tokens.md).

## The two-layer token system

```
Code default (createToken)
    ↓ overridden by
Environment tokens (environments.<mode>.tokens)
    ↓ overridden by
Platform tokens (environments.<mode>.platforms.<platform>.tokens)
```

Later layers win. Platform-specific values override environment values, which override code defaults. The generated bootstrap merges all three layers before any application code runs.

## 1. Declare a token with a default

```ts
// src/background/tokens.ts
import { createToken, HexaContext } from '@hexajs-dev/common';

export const API_BASE_URL  = createToken('API_BASE_URL', 'https://api.example.com', HexaContext.Background);
export const MAX_CLIP_SIZE = createToken('MAX_CLIP_SIZE', 1024 * 1024, HexaContext.Background); // 1 MB
export const FEATURE_OCR   = createToken('FEATURE_OCR', false, HexaContext.Background);
```

`createToken(key, defaultValue, context?)` registers the key, its static default, and an optional context scope. The build scanner picks this up during AOT and adds it to the bootstrap token registry. Do not call `createToken` conditionally — the scanner expects a static literal key and a static default value at the call site.

## 2. Inject tokens into services

```ts
// src/background/services/config.service.ts
import { Injectable, HexaContext, Inject } from '@hexajs-dev/common';
import { StoragePort } from '@hexajs-dev/ports';
import { API_BASE_URL, MAX_CLIP_SIZE, FEATURE_OCR } from '../tokens';
import { DEFAULT_CONFIG, ClipVaultConfig } from '../../contract/config';

@Injectable({ context: HexaContext.Background })
export class ConfigService {
  constructor(private readonly storagePort: StoragePort, @Inject(API_BASE_URL) private readonly apiBaseUrl: string, @Inject(MAX_CLIP_SIZE) private readonly maxClipSize: number, @Inject(FEATURE_OCR) private readonly featureOcr: boolean) {}

  async loadConfig(): Promise<ClipVaultConfig> {
    const stored = await this.storagePort.get<Partial<ClipVaultConfig>>('clipVaultConfig');
    return this.mergeConfig(DEFAULT_CONFIG, stored ?? {});
  }

  mergeConfig(base: ClipVaultConfig, patch: Partial<ClipVaultConfig>): ClipVaultConfig {
    return {
      ...base,
      ...patch,
      storage: {
        ...base.storage,
        ...patch.storage,
        maxItems: Math.min(patch.storage?.maxItems ?? base.storage.maxItems, this.maxClipSize),
      },
    };
  }

  isOcrEnabled(): boolean {
    return this.featureOcr;
  }
}
```

The service never reads from `process.env`, never branches on `window.location.hostname`, and never contains string constants that differ between environments. Those values arrive as injected constructor arguments.

## 3. Override tokens per environment and platform

In `hexa-cli.config.json`, override any token under `environments.<mode>.tokens` for an environment-wide change, or under `environments.<mode>.platforms.<platform>.tokens` for a platform-specific change:

```json
{
  "environments": {
    "development": {
      "tokens": [
        { "key": "API_BASE_URL",  "value": "https://dev.api.example.com" },
        { "key": "FEATURE_OCR",   "value": true }
      ],
      "platforms": {
        "chrome": {
          "tokens": [
            { "key": "MAX_CLIP_SIZE", "value": 5242880 }
          ]
        },
        "firefox": {
          "tokens": [
            { "key": "FEATURE_OCR", "value": false }
          ]
        }
      }
    },
    "production": {
      "tokens": [
        { "key": "API_BASE_URL", "value": "https://api.example.com" }
      ]
    }
  }
}
```

With this config:
- `development + chrome`: API points at dev, OCR enabled, max clip size 5 MB.
- `development + firefox`: API points at dev, OCR explicitly disabled (Firefox override wins over environment default).
- `production + any`: API points at production, code-default for OCR (`false`) applies since no production override exists.

## 4. Platform-aware ports and the built-in platform token

HexaJS injects two built-in tokens for every build:

| Token | Type | Example value |
|---|---|---|
| `HEXA_PLATFORM` | `string` | `'chrome'`, `'firefox'`, `'safari'` |
| `HEXA_BUILD_MODE` | `string` | `'development'`, `'production'` |

These are always available via `@Inject`:

```ts
import { Inject, Injectable, HEXA_PLATFORM, HEXA_BUILD_MODE } from '@hexajs-dev/common';

@Injectable()
export class DiagnosticsService {
  constructor(@Inject(HEXA_PLATFORM) private readonly platform: string, @Inject(HEXA_BUILD_MODE) private readonly buildMode: string) {}

  getContext(): string {
    return `${this.platform}/${this.buildMode}`;
  }
}
```

## 5. __HEXA_PLATFORM__ and tree-shaking

HexaJS ports use `__HEXA_PLATFORM__` — a compile-time constant replaced by the bundler — to eliminate dead platform branches from each build output.

```ts
// Inside a port (framework code)
const platform = typeof __HEXA_PLATFORM__ !== 'undefined'
  ? __HEXA_PLATFORM__
  : this.platform;

switch (platform) {
  case 'firefox': return this.firefoxImpl();
  case 'chrome':  return this.chromeImpl();
  default:        return this.chromeImpl();
}
```

When the bundler processes a Chrome build, `__HEXA_PLATFORM__` becomes the string literal `'chrome'`. The `firefox` branch becomes dead code and is eliminated by tree-shaking. The Firefox build output does not contain the Chrome branch.

You can use the same pattern in your own port implementations or low-level services:

```ts
declare const __HEXA_PLATFORM__: string | undefined;

function getStorageKey(): string {
  const platform = typeof __HEXA_PLATFORM__ !== 'undefined' ? __HEXA_PLATFORM__ : 'chrome';
  return platform === 'firefox' ? 'firefoxStorage' : 'chromeStorage';
}
```

Keep this pattern at the lowest level — ports and platform-aware utilities. Application-layer code should depend on injected tokens or port abstractions, not `__HEXA_PLATFORM__` directly.

## 6. Runtime access to injected values

If you need to read a token value from a function or class that is outside the DI constructor (rare), use `inject(...)` after bootstrap has initialized the container:

```ts
import { inject } from '@hexajs-dev/common';

const platform = inject<string>('HEXA_PLATFORM');
```

This works only after the HexaJS bootstrap has run for the current context. Do not use it in module-level code that executes before bootstrap.

## Pitfalls

- **Dynamic `createToken` keys.** The build scanner expects a string literal as the first argument. `createToken(someVariable, value)` will not be scanned and the token will not be registered. Always use a literal: `createToken('MY_KEY', value)`.
- **Token key collisions.** Token keys are global strings within a context. If two `createToken` calls share the same key, the last one wins at bootstrap. Use a consistent prefix convention (e.g., `APP_`, `FEATURE_`, `PLATFORM_`) to avoid accidental collisions.
- **Context mismatch.** A token declared with `HexaContext.Background` is only registered in the background bootstrap. Injecting it from a content or UI service will fail at runtime. Omit the context argument for general tokens that should be available in any context.
- **Missing production overrides for sensitive values.** The code default is the fallback for any environment that does not override a token. If `API_BASE_URL` defaults to a dev endpoint and you forget to add a production override, production builds will point at dev. Set development-specific values as the default and require production overrides explicitly.

## Related reading

- [Decorators & Tokens](../core-fundamentals/tokens.md)
- [Dependency Injection](../core-fundamentals/dependency-injection.md)
- [Build Pipeline](../cli-tooling/build-pipeline.md)
- [Build Output](../cli-tooling/build-output.md)
- [Manifest Patching](../cli-tooling/manifest-patching.md)

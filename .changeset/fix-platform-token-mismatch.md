---
"@hexajs-dev/common": patch
---

Fix: remove orphan `PLATFORM` token that caused DI runtime failures

`@hexajs-dev/common` was exporting a `PLATFORM = "PLATFORM"` constant that
was never registered in the CLI-generated bootstrap. Any service using
`@Inject(PLATFORM)` would throw `DI Error: No provider for PLATFORM.` at
runtime, causing service worker registration failure (status code 15).

**Migration:** replace `PLATFORM` with `HEXA_PLATFORM` in all `@Inject()`
calls and imports:

```ts
// Before
import { Inject, PLATFORM } from '@hexajs-dev/common';
constructor(@Inject(PLATFORM) private readonly platform?: string) {}

// After
import { Inject, HEXA_PLATFORM } from '@hexajs-dev/common';
constructor(@Inject(HEXA_PLATFORM) private readonly platform?: string) {}
```

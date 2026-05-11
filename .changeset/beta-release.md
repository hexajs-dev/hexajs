---
"@hexajs-dev/common": patch
"@hexajs-dev/core": patch
"@hexajs-dev/ports": patch
"@hexajs-dev/ui": patch
"@hexajs-dev/cli": patch
---

Prepare beta prerelease with aggregated changes since previous alpha:

- Hardening and security improvements across packages.
- Support for external messages and hardened communication flows.
- License updates and housekeeping.
- Refactor: improved code structure and readability (code organization, exports).
- Fix: npm scaffolding dependency resolution with ERESOLVE install retry fallback.
- Support external content scripts in manifest merge and manifest handling improvements.
- Updated internal package linkage metadata and dependency updates across packages.
- Misc: release infra changes and versioning trigger adjustments.

Run the following to enter beta prerelease and apply versions:

```bash
pnpm changeset pre enter beta
pnpm run version-packages
``` 

Or to run non-interactive prerelease bump:

```bash
pnpm changeset version --prerelease beta
pnpm install --lockfile-only
```

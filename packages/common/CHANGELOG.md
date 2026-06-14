# @hexajs-dev/common

## 1.0.4

### Patch Changes

- 7b27092: Fix: remove orphan `PLATFORM` token that caused DI runtime failures

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

- 7b27092: (cli): add profile resolver for Chromium browsers, test(cli): enhance asset security tests, test(cli): add configuration resolution tests, test(cli): extend manifest watch mode tests, refactor(common): remove unused platform tokens, test(common): add public tokens contract test

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

### Major Changes

- First stable release 1.0.0

  HexaJS is now production-ready. This release marks the graduation from pre-release to the first stable, supported version of the framework.

  Highlights since the last alpha:

  - Vue support: CLI can now scaffold Vue-managed surfaces (popup, devtools, newtab).
  - Chrome watch mode with automatic browser launch and configuration options.
  - Hardened communication flows and external message support.
  - External content scripts support in manifest merging.
  - Security and validation improvements across all packages.
  - Improved code structure, exports, and internal dependency resolution.

### Patch Changes

- 9fe2660: Prepare beta prerelease with aggregated changes since previous alpha:

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

- 7b368fd: trigger release
- 9501729: documentation changes. simplify first application logic, minor bug fixes
- license
- Support external messages and hardening communication
- 1804e01: Hardening

## 0.9.3-beta.11

## 0.9.3-beta.10

## 0.9.3-beta.9

### Patch Changes

- 9501729: documentation changes. simplify first application logic, minor bug fixes

## 0.9.3-beta.8

### Patch Changes

- 9fe2660: Prepare beta prerelease with aggregated changes since previous alpha:

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

## 0.9.3-alpha.7

## 0.9.3-alpha.6

## 0.9.3-alpha.5

## 0.9.3-alpha.4

## 0.9.3-alpha.3

### Patch Changes

- 1804e01: Hardening

## 0.9.3-alpha.2

### Patch Changes

- 7b368fd: trigger release
- license
- Support external messages and hardening communication

## 0.9.3-alpha.1

### Patch Changes

- a6044cb: license

## 0.9.3-alpha.0

### Patch Changes

- a6044cb: license

## 0.9.2

### Patch Changes

- 9cac0a7: add readme to packages

## 0.9.1

## 0.9.1

## 2.0.0

### Minor Changes

- 2b9af51: Changing worker injection

## 1.0.0

### Minor Changes

- d993bfb: Vulnerability adaptions, HMR backround to content fix, examples updates

## 0.0.1

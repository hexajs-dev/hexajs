# @hexajs-dev/ports

## 1.0.2

### Patch Changes

- @hexajs-dev/common@1.0.2

## 1.0.1

### Patch Changes

- @hexajs-dev/common@1.0.1

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
- fec6a5c: Fix npm scaffolding dependency resolution by improving internal package linkage metadata and adding an npm ERESOLVE install retry fallback in hexa new.
- Updated dependencies [9fe2660]
- Updated dependencies [7b368fd]
- Updated dependencies [9501729]
- Updated dependencies
- Updated dependencies
- Updated dependencies [1804e01]
- Updated dependencies
  - @hexajs-dev/common@2.0.0

## 0.9.3-beta.11

### Patch Changes

- @hexajs-dev/common@0.9.3-beta.11

## 0.9.3-beta.10

### Patch Changes

- @hexajs-dev/common@0.9.3-beta.10

## 0.9.3-beta.9

### Patch Changes

- 9501729: documentation changes. simplify first application logic, minor bug fixes
- Updated dependencies [9501729]
  - @hexajs-dev/common@0.9.3-beta.9

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

- Updated dependencies [9fe2660]
  - @hexajs-dev/common@0.9.3-beta.8

## 0.9.3-alpha.7

### Patch Changes

- @hexajs-dev/common@0.9.3-alpha.7

## 0.9.3-alpha.6

### Patch Changes

- @hexajs-dev/common@0.9.3-alpha.6

## 0.9.3-alpha.5

### Patch Changes

- fec6a5c: Fix npm scaffolding dependency resolution by improving internal package linkage metadata and adding an npm ERESOLVE install retry fallback in hexa new.
  - @hexajs-dev/common@0.9.3-alpha.5

## 0.9.3-alpha.4

### Patch Changes

- @hexajs-dev/common@0.9.3-alpha.4

## 0.9.3-alpha.3

### Patch Changes

- 1804e01: Hardening
- Updated dependencies [1804e01]
  - @hexajs-dev/common@0.9.3-alpha.3

## 0.9.3-alpha.2

### Patch Changes

- 7b368fd: trigger release
- license
- Support external messages and hardening communication
- Updated dependencies [7b368fd]
- Updated dependencies
- Updated dependencies
  - @hexajs-dev/common@0.9.3-alpha.2

## 0.9.3-alpha.1

### Patch Changes

- a6044cb: license
- Updated dependencies [a6044cb]
  - @hexajs-dev/common@0.9.3-alpha.1

## 0.9.3-alpha.0

### Patch Changes

- a6044cb: license
- Updated dependencies [a6044cb]
  - @hexajs-dev/common@0.9.3-alpha.0

## 0.9.2

### Patch Changes

- 9cac0a7: add readme to packages
- Updated dependencies [9cac0a7]
  - @hexajs-dev/common@0.9.2

## 0.9.1

### Patch Changes

- @hexajs-dev/common@0.9.1

## 0.9.1

### Patch Changes

- @hexajs/common@0.9.1

## 2.0.0

### Minor Changes

- 2b9af51: Changing worker injection

### Patch Changes

- Updated dependencies [2b9af51]
  - @hexajs-dev/common@2.0.0

## 1.0.0

### Minor Changes

- d993bfb: Vulnerability adaptions, HMR backround to content fix, examples updates

### Patch Changes

- Updated dependencies [d993bfb]
  - @hexajs-dev/common@1.0.0

## 0.0.1

### Patch Changes

- @hexajs-dev/common@0.0.1

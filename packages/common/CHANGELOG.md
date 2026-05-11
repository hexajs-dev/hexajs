# @hexajs-dev/common

## 0.9.3-alpha.8

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

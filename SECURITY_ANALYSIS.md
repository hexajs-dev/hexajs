# HexaJS Security Analysis

> **Date:** March 9, 2026  
> **Scope:** `packages/core` · `packages/cli` · `examples/`  
> **Methodology:** Static source-code review — no code was modified.  
> **Severity scale:** 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low · ℹ️ Info

---

## Table of Contents

1. [Summary](#1-summary)
2. [Critical Risks](#2-critical-risks)
3. [High Risks](#3-high-risks)
4. [Medium Risks](#4-medium-risks)
5. [Low Risks](#5-low-risks)
6. [Informational](#6-informational)
7. [Recommendations Quick-Reference](#7-recommendations-quick-reference)

---

## 1. Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 4 |
| 🟡 Medium | 5 |
| 🔵 Low | 4 |
| ℹ️ Info | 3 |

HexaJS is a **browser-extension framework** — its primary attack surface differs from a typical web application. The most important risks are:

- Unvalidated cross-context messaging (background ↔ content ↔ UI).
- Unsafe use of `devtools.inspectedWindow.eval()` without content sanitisation.
- CLI executing arbitrary shell commands constructed from config inputs.
- Prototype-pollution vectors in the DI container and deep-merge helpers.
- Metadata stored on class constructors (`.prototype`), which is accessible and mutable at runtime.

---

## 2. Critical Risks

---

### 🔴 C-1 — No message sender validation in `ControllerContainer` and `HandlerContainer`

**Files:**  
- `packages/core/src/background/controller/container.ts`  
- `packages/core/src/content/handler/container.ts`

**Description:**  
Both `initializeListener()` methods accept **all** incoming `runtime.onMessage` events without ever inspecting the `sender` object. Any page (or another extension) that can call `chrome.runtime.sendMessage(extensionId, …)` can invoke any registered `@Action` or `@Handle` handler, including those that mutate extension state or return sensitive data.

```typescript
// container.ts — no sender check at all
this.runtimePort.onMessage((message, sender, sendResponse) => {
    const { action, event, payload } = message;
    if (action && this.unicastHandlers.has(action)) {
        const handler = this.unicastHandlers.get(action)!;
        Promise.resolve(handler(payload, sender))   // payload is completely untrusted
            .then(result => sendResponse(result))
```

**Impact:**  
- Any website can trigger background actions if the extension's ID is known (or guessable via `externally_connectable`).  
- Malicious content scripts injected by third-party extensions can call handlers freely.  
- Sensitive data returned by handlers is exposed to the attacker via `sendResponse`.

**Recommendation:**  
Validate `sender.id === chrome.runtime.id` for messages that must originate from the extension itself. Provide a way for library users to register per-action allowlists for external callers.

---

### 🔴 C-2 — `devtools.inspectedWindow.eval()` accepts arbitrary string expressions

**File:** `packages/core/src/ui/ports/devtools.port.ts`

**Description:**  
`DevtoolsPort.inspectedWindow.eval(expression, …)` takes a raw `string` from the caller and forwards it directly to the Chrome DevTools `eval` API, which executes JavaScript inside the inspected page.

```typescript
eval: (expression: string, options?: { … }): Promise<any> => {
    // …
    this.browser.devtools.inspectedWindow.eval(expression, options, (result, exceptionInfo) => {
```

**Impact:**  
If any part of the extension (UI or background) constructs the `expression` string using **untrusted data** (e.g., user input, data fetched from a web page, data received over a message), this becomes a Remote Code Execution vulnerability inside the inspected tab. Because the API has full page-script privileges, an attacker could exfiltrate credentials, cookies, or DOM content.

**Recommendation:**  
- Never interpolate untrusted values into the `expression` string.  
- Add a lint/build-time warning through the CLI analyzer for any call-site that does not pass a string literal.  
- Document clearly that this API is dangerous and provide a safer abstraction for common use-cases (e.g., reading DOM properties via a message to the content script instead of `eval`).

---

### 🔴 C-3 — Prototype-pollution in the DI `Container` and config `deepMerge`

**Files:**  
- `packages/core/src/di/container.ts`  
- `packages/cli/src/bin/config/config.ts`

**Description:**  
**A. DI Container (`container.ts`)**  
The `Container.register()` and `Container.resolve()` methods use a `Map<any, …>` keyed by `any`. There is no guard against a `token` being the string `"__proto__"`, `"constructor"`, or `"prototype"`. While `Map` itself is safe, the `_autoFactory` path calls `new (token as any)(…)`, where a carefully crafted `token` value could construct dangerous objects.

More critically, the `inject()` metadata path stores injection arrays on `target.__hexa_injects__` directly on the *constructor function*, meaning any code that can access the class constructor can read or replace the DI wiring.

**B. `deepMerge` in `config.ts`**  
```typescript
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key of Object.keys(source) as (keyof T)[]) {
        // No check for __proto__ / constructor / prototype
        if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
            result[key] = deepMerge(targetVal, sourceVal) as any;
        } else if (sourceVal !== undefined) {
            result[key] = sourceVal;   // ← direct assignment, no key sanitisation
        }
    }
    return result;
}
```

`Object.keys()` does not enumerate `__proto__`, but `JSON.parse()` **does** produce a key named `"__proto__"` if the JSON contains it. Because `loadHexaConfig` calls `fs.readJson(configPath)` (which uses `JSON.parse` internally) and then `deepMerge(DEFAULT_CONFIG, userConfig)`, a `hexa-cli.config.json` containing `{"__proto__": {"polluted": true}}` can pollute `Object.prototype`.

**Impact:**  
- Prototype pollution at the CLI level can affect all subsequent object property lookups during a build run, leading to unexpected behavior, potential command injection, or information disclosure.
- In the `core` DI container, polluted metadata arrays can silently rewire dependency injection.

**Recommendation:**  
- In `deepMerge`, reject or skip keys equal to `__proto__`, `constructor`, and `prototype`.  
- Use `Object.create(null)` or `structuredClone` as an intermediate step.  
- In `Container`, validate that tokens are either a function or a non-`__proto__` string before `Map` insertion.

---

## 3. High Risks

---

### 🟠 H-1 — `execSync` with user-supplied `buildCommand` string

**File:** `packages/cli/src/index.ts`

```typescript
function runUiBuildCommand(surface: 'popup' | 'devtools', command: string): void {
    execSync(command, {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: process.env.ComSpec ?? (process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'),
    });
}
```

**Description:**  
`command` comes directly from `resolved.ui.popup.buildCommand` / `resolved.ui.devtools.buildCommand`, which is read from the user's `hexa-cli.config.json` **without any sanitisation or allowlist**. If the config file is ever written programmatically (e.g., by a scaffolding script reading user input) or a malicious dependency can write to it, arbitrary OS commands execute with the CLI process's privileges.

**Impact:**  
Full arbitrary command execution on the developer's machine during `hexa build`.

**Recommendation:**  
- Parse the command into a command + args array and use `execFileSync` or `spawnSync` instead of `execSync` with `shell: true`.  
- Validate the command string against an allowlist of permitted build tools (e.g., `vite`, `npm run`, `pnpm run`).  
- Warn when `buildCommand` is set and the command looks unusual.

---

### 🟠 H-2 — Untyped `payload` flows through all message handlers

**Files:**  
- `packages/core/src/background/controller/container.ts`  
- `packages/core/src/content/handler/container.ts`  
- `packages/core/src/services/hexa-client.base.ts`

**Description:**  
Every handler signature is typed as `(payload: any, sender: …)`. The `payload` is deserialized JSON from `chrome.runtime.onMessage` and passed directly into user handler methods with zero runtime validation or schema enforcement.

```typescript
export type BackgroundHandlerFn = (payload: any, sender: chrome.runtime.MessageSender) => any | Promise<any>;
```

**Impact:**  
- Handler implementations are vulnerable to unexpected types (null, array, deeply-nested object) that can cause runtime errors, unexpected state mutations, or, in combination with C-1, injection-style attacks if the payload is ever used in a dangerous way (e.g., passed to `eval`, used as a file path, used as a SQL/NoSQL query).  
- There is no guarantee of type safety at runtime even when TypeScript types look correct at compile time.

**Recommendation:**  
- Encourage (and optionally enforce via the CLI analyzer) that handler payloads are validated against a schema (e.g., Zod, class-validator) before use.  
- Provide a typed `Handle<TPayload>` decorator overload that wraps handlers with automatic runtime validation.

---

### 🟠 H-3 — Error messages leak internal stack information to remote callers

**File:** `packages/core/src/background/controller/container.ts`

```typescript
Promise.resolve(handler(payload, sender))
    .then(result => sendResponse(result))
    .catch(error => sendResponse({ __hexa_error__: error.message }));
```

**Description:**  
When a handler throws, the raw `error.message` is serialised and sent back to the caller via `sendResponse`. Depending on the runtime environment (Node.js, V8), `error.message` can include file paths, module names, or other internal details.

**Impact:**  
Any caller (including a malicious external page that triggers a handler via C-1) receives internal error messages that can be used to fingerprint the extension's internal structure, discover service names, or understand its logic.

**Recommendation:**  
- Return a generic error object: `{ __hexa_error__: 'Internal error' }`.  
- Log the full error internally (e.g., via the user's logger service).  
- Optionally expose a `debug` flag so that full messages are only returned in development mode.

---

### 🟠 H-4 — `followSymbolicLinks: true` in static asset copying

**File:** `packages/cli/src/generators/assets/generator.ts`

```typescript
const files = await fg(patterns, { cwd, onlyFiles: true, dot: true, unique: true, followSymbolicLinks: true });
```

**Description:**  
Glob pattern matching is done with `followSymbolicLinks: true`. If any user-controlled or dependency-supplied symlink escapes the project root (e.g., `../../etc/passwd`), the file is copied to the extension's output directory and potentially shipped.

**Impact:**  
Sensitive files from outside the project tree can be bundled into the built extension.

**Recommendation:**  
- Set `followSymbolicLinks: false` unless there is a specific documented need.  
- After resolving each file path, assert that it falls within the project root with `path.resolve` comparison.

---

## 4. Medium Risks

---

### 🟡 M-1 — Decorator metadata written to mutable prototype properties

**Files:**  
- `packages/core/src/background/controller/decorators.ts`  
- `packages/core/src/content/handler/decorators.ts`  
- `packages/core/src/di/decorators.ts`  
- `packages/core/src/store/decorators.ts`

**Description:**  
All decorators store metadata on the class prototype or constructor using plain mutable properties:

```typescript
// decorators.ts
target.constructor.__hexa_actions__ = target.constructor.__hexa_actions__ || {};
target.__hexa_injects__ = existingInjects;
target.__hexa_state__ = { type: 'state', options };
```

These are writable, enumerable, and accessible from anywhere in the same JS context. A compromised dependency or a malicious content script can mutate action routing tables, inject fake handlers, or remove DI wiring.

**Recommendation:**  
- Use `Object.defineProperty` with `writable: false, configurable: false, enumerable: false`.  
- Consider using a `WeakMap`-based metadata store (similar to the TC39 decorator metadata proposal) so that metadata is not enumerable on the constructor.

---

### 🟡 M-2 — Global singleton DI container with no isolation

**File:** `packages/core/src/di/container.ts`

```typescript
let _container: Container | null = null;

export function setContainer(container: Container): void {
  _container = container;
}
```

**Description:**  
A single module-level variable holds the active DI container. Any code in the same module scope (e.g., a malicious transitive dependency) can call `setContainer(evilContainer)` and replace the entire dependency tree. There is no access control or integrity check.

**Impact:**  
- Dependency hijacking at runtime: replacing a service implementation with an attacker-controlled one.  
- Calling `inject()` before `setContainer()` throws a clearly-worded error that leaks the framework name and version information to anyone who triggers it.

**Recommendation:**  
- Seal the container after bootstrap: once `setContainer` has been called, prevent further calls (throw an error or ignore subsequent calls).  
- Consider exporting `setContainer` only for internal use with a `@internal` JSDoc tag and note it clearly in docs.

---

### 🟡 M-3 — `host_permissions: ['<all_urls>']` in generated manifest templates

**File:** `packages/cli/src/generators/manifest/templates.ts`

```typescript
permissions: ['storage', 'tabs'],
host_permissions: ['<all_urls>'],
```

**Description:**  
Every generated extension starts with `<all_urls>` host permission, granting full access to all sites. This is the broadest possible permission and triggers browser warnings for users. Framework users who are unaware may not realise the scope of this default.

**Impact:**  
- Users installing extensions built with HexaJS are exposed to an overly-broad permission scope by default.  
- If the extension is compromised (via C-1 or H-2), `<all_urls>` maximises the blast radius.

**Recommendation:**  
- Default to an empty `host_permissions` array and let the user explicitly opt in.  
- Emit a CLI warning if `<all_urls>` is present in the final manifest.  
- Document that this default should be tightened before publishing to the Chrome Web Store.

---

### 🟡 M-4 — `__hexa_error__` sentinel key is a de-facto protocol detail

**File:** `packages/core/src/background/controller/container.ts` and `handler/container.ts`

**Description:**  
The string `__hexa_error__` is used as a reserved key in the response envelope. Any consumer (including a malicious external caller) that knows this key can craft a response payload that looks like an error to the framework, potentially suppressing correct handler responses or tricking client-side error handling code.

**Recommendation:**  
- Use a less guessable, non-enumerable error marker, or encode errors as a typed response object with a discriminant union: `{ ok: false, code: string }` vs. `{ ok: true, data: T }`.  
- Validate the response shape on the caller side before trusting it.

---

### 🟡 M-5 — `randomUUID()` used as a filename in content-script outputs

**File:** `packages/cli/src/generators/content/generator.ts`

```typescript
import { randomUUID } from 'crypto';
// …
name: `content-${randomUUID()}`,
```

**Description:**  
While `crypto.randomUUID()` is cryptographically secure and this usage does not introduce a direct security vulnerability, the generated file names are non-deterministic. This means every build produces a different `manifest.json`, which **breaks reproducible builds**. An attacker who can intercept the build pipeline could substitute a different content script without the filename changing suspiciously.

**Recommendation:**  
- Derive the name deterministically from the content hash or from the class names included in the group.  
- This also improves build caching.

---

## 5. Low Risks

---

### 🔵 L-1 — `console.log` with platform and class names in production builds

**Files:**  
- `packages/core/src/ports/runtime.port.ts`  
- `packages/core/src/background/ports/tabs.port.ts`

```typescript
console.log('Resolved platform in RuntimePort:', platform);
console.log('Resolved platform in TabsPort:', platform);
```

**Description:**  
These `console.log` calls are not gated by a debug flag and will appear in production builds, leaking the resolved browser platform string and service class names to anyone who opens the browser console.

**Recommendation:**  
- Gate all diagnostic logging behind the `HEXA_DEBUG` token or remove them entirely.  
- The CLI already provides this token — use it: `if (inject(HEXA_DEBUG)) console.log(…)`.

---

### 🔵 L-2 — `findWorkspaceCoreMetadata` walks the entire filesystem upward

**File:** `packages/cli/src/compiler/di/scanner.ts`

```typescript
private findWorkspaceCoreMetadata(startDir: string): string | undefined {
    let currentDir = path.resolve(startDir);
    while (true) {
        const workspaceCandidate = path.join(currentDir, 'packages', 'core', 'dist', 'hexa-metadata.json');
        if (fs.existsSync(workspaceCandidate)) return workspaceCandidate;
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        currentDir = parentDir;
    }
```

**Description:**  
This loop walks all the way to the filesystem root looking for `packages/core/dist/hexa-metadata.json`. If an attacker can place a file at that path anywhere above the project root (e.g., in a shared `/packages/core/dist/` on a multi-tenant CI server), the CLI will load and trust that file as the @hexajs/core metadata, silently changing which classes are considered injectable.

**Recommendation:**  
- Limit the upward walk to a configurable maximum depth (e.g., 3 levels).  
- Stop at the workspace/git root (detect `pnpm-workspace.yaml` or `.git`).  
- Log a warning when the fallback path is used.

---

### 🔵 L-3 — `broadcastMessage` silently swallows per-tab send errors

**File:** `packages/core/src/background/ports/tabs.port.ts`

```typescript
for (const tab of tabs) {
    this.emitTabMessage(tab.id!, message).catch((err) => {
        console.error(`Error broadcasting to tab ${tab.id}:`, err);
    });
}
resolve();  // resolves before all sends complete
```

**Description:**  
The broadcast resolves immediately after queuing messages, before confirming delivery to any tab. Per-tab errors are only logged. There is no way for the caller to know whether any or all tabs received the message.

**Impact:**  
Silent failure in broadcast communication. Critical events (e.g., "sign out all tabs") may be lost without the background script being aware.

**Recommendation:**  
- Return a `Promise<PromiseSettledResult<void>[]>` so callers can inspect per-tab results.  
- Document the fire-and-forget semantics explicitly.

---

### 🔵 L-4 — `tabId!` non-null assertion without runtime guard

**File:** `packages/core/src/background/ports/tabs.port.ts`

```typescript
this.emitTabMessage(tab.id!, message)
```

**Description:**  
`tab.id` can be `undefined` for devtools or incognito windows in some browsers. The non-null assertion bypasses TypeScript's check and will cause a runtime error (`undefined` passed as `tabId`).

**Recommendation:**  
Filter out tabs where `tab.id === undefined` before broadcasting.

---

## 6. Informational

---

### ℹ️ I-1 — Token values are serialised with `JSON.stringify` into generated code

**File:** `packages/cli/src/generators/background/generator.ts`

```typescript
const valueStr = JSON.stringify(token.value);
registrations.push(`  container.register('${token.key}', () => ${valueStr});`);
```

Token keys are embedded via string interpolation without escaping. A token key containing a single-quote or backtick (e.g., `it's`), while unlikely in practice, would produce syntactically broken generated JS. Validate that token keys match `/^[A-Z0-9_]+$/` at config-load time.

---

### ℹ️ I-2 — `platformResolver` defaults silently to `chrome` for unknown platforms

**File:** `packages/core/src/shared/platforms.methods.ts`

```typescript
default:
    console.warn(`Unknown platform "${platform}", defaulting to "chrome" namespace…`);
    return chrome;
```

If a token injection bug, config typo, or prototype-pollution attack causes `platform` to be an unexpected value, the extension silently runs under the `chrome` namespace. On Firefox or Safari this may cause subtle API failures. The commented-out `throw` would be safer as a compile-time or runtime guard.

---

### ℹ️ I-3 — `HandlerContainer` is decorated with the wrong context

**File:** `packages/core/src/content/handler/container.ts`

```typescript
@Injectable({ context: InjectableContext.Background })   // ← should be Content
export class HandlerContainer {
```

The `HandlerContainer` (content-side switchboard) is annotated as `InjectableContext.Background`. This is a metadata bug that the CLI's `DIAnalyzer` context-violation checker could catch, but only if `HandlerContainer` itself is analysed as a dependency. In its current form, the wrong context label may confuse the static analyzer and suppress real cross-context violation errors.

---

## 7. Recommendations Quick-Reference

| ID | File(s) | Action |
|----|---------|--------|
| C-1 | `controller/container.ts`, `handler/container.ts` | Validate `sender.id` before dispatching messages |
| C-2 | `ui/ports/devtools.port.ts` | Never interpolate untrusted data into `eval()` expressions; add CLI lint check |
| C-3 | `di/container.ts`, `config.ts` | Guard `deepMerge` and DI `Map` against `__proto__` / prototype-pollution keys |
| H-1 | `cli/src/index.ts` | Replace `execSync(shell:true)` with `spawnSync` + command allowlist |
| H-2 | `container.ts` (both) | Provide typed payload validation hooks for `@Action` / `@Handle` |
| H-3 | `controller/container.ts` | Return generic error string in `sendResponse`; log internally |
| H-4 | `generators/assets/generator.ts` | Set `followSymbolicLinks: false`; assert paths stay within project root |
| M-1 | All decorator files | Use `Object.defineProperty` with non-writable, non-configurable descriptors |
| M-2 | `di/container.ts` | Seal container after first `setContainer()` call |
| M-3 | `generators/manifest/templates.ts` | Default `host_permissions` to `[]`; warn on `<all_urls>` |
| M-4 | `container.ts` (both) | Replace `__hexa_error__` sentinel with a typed discriminated-union response |
| M-5 | `generators/content/generator.ts` | Use content-hash for deterministic file naming |
| L-1 | `runtime.port.ts`, `tabs.port.ts` | Gate `console.log` behind `HEXA_DEBUG` token |
| L-2 | `compiler/di/scanner.ts` | Cap filesystem walk depth; stop at git/workspace root |
| L-3 | `background/ports/tabs.port.ts` | Return settled results from `broadcastMessage` |
| L-4 | `background/ports/tabs.port.ts` | Filter tabs with `undefined` id before sending |
| I-1 | `generators/background/generator.ts` | Validate token keys at config-load time |
| I-2 | `shared/platforms.methods.ts` | Consider throwing on unknown platform in production mode |
| I-3 | `content/handler/container.ts` | Fix `@Injectable` context from `Background` to `Content` |

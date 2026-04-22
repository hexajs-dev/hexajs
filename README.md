# hexajs

HexaJS is a framework for browser extension backends (background/content/store) with optional UI surfaces.

## UI Modes

- Managed mode (`ui.popup.mode = "managed"`): Hexa builds UI source (default `ui/popup`) with its internal Vite pipeline.
- External mode (`ui.popup.mode = "external"`): Hexa runs optional `buildCommand`, then copies `distDir` and maps `indexFile` into manifest.
- Devtools is optional (`ui.devtools.mode = "none" | "managed" | "external"`).

## Bundling Boundary

- Hexa bundler only compiles extension runtime contexts: `background` and `content`.
- UI frameworks (React and others) are handled as prebuilt assets via UI config.

## Content Lifecycle Timing

- Content `onInit()` runs after bootstrap and only after the document is ready for interaction.
- If `document.readyState` is `loading`, Hexa waits for `DOMContentLoaded` before running `onInit()`.
- If `document.readyState` is `interactive` or `complete`, `onInit()` runs immediately.
- Content `onDestroy()` always registers a `pagehide` fallback and will warn when host page Permissions Policy blocks `unload`.

## Example Configs

- Managed popup/devtools-none example: [examples/generated/hexa-cli.managed-ui.example.json](examples/generated/hexa-cli.managed-ui.example.json)
- External React popup example: [examples/generated/hexa-cli.external-ui.example.json](examples/generated/hexa-cli.external-ui.example.json)

## Versioning and Releases

This repository uses Changesets for package versioning and npm publishing.

- Public release scope: `@hexajs/cli`, `@hexajs/common`, `@hexajs/core`, `@hexajs/ports`, `@hexajs/ui`
- Private packages are excluded from publishing (`documentation` and all `examples/*`)
- Public packages are configured for strict lockstep versioning

Contributor flow:

1. Make code changes on a branch.
2. Run `pnpm changeset` and select impacted public package(s).
3. Choose `patch`, `minor`, or `major`.
4. Write a short release note summary.
5. Commit both code and the generated `.changeset/*.md` file.
6. Open a pull request.

Release flow on `main`:

1. The release workflow creates or updates a `Version Packages` pull request from queued changesets.
2. When the `Version Packages` pull request is merged, the workflow builds and publishes to npm.
3. GitHub releases and tags are created for published versions.

Repository requirements:

- Configure `NPM_TOKEN` in repository secrets.
- Install the Changesets GitHub App for pull request guidance.
- Add branch protection for `main` with required checks according to your policy.



# HexaJS

HexaJS is a powerful, decorator-first framework designed specifically for building scalable browser extension backends (background workers, content scripts, and state management) with flexible support for UI surfaces.

> 🚧 **WORK IN PROGRESS & CONTRIBUTING POLICY**
> HexaJS is currently in active, heavy development. To maintain the core architectural vision and development velocity as a solo maintainer, **I am not accepting external Pull Requests at this time**. 
> 
> However, community feedback is highly valued! If you find a bug or have a feature suggestion, please feel free to open an Issue.

---

## 🏗 Bundling Boundary

HexaJS enforces a strict separation of concerns. The internal Hexa bundler is designed to **only compile extension runtime contexts** (the `background` script and `content` scripts). 

UI frameworks (like React, Vue, or Svelte) are treated as prebuilt assets. Hexa handles the plumbing, routing, and injection, allowing you to build your UI with the tools you already know via the UI configuration.

## 🖥 UI Modes

HexaJS gives you complete control over how your extension's UI (Popup, Options, DevTools) is built and served. 

* **Managed Mode** (`ui.popup.mode = "managed"`): Hexa handles the build process for you. It builds the UI source (defaults to `ui/popup`) using its internal Vite pipeline.
* **External Mode** (`ui.popup.mode = "external"`): You bring your own build pipeline. Hexa runs your optional `buildCommand`, copies your `distDir`, and maps your `indexFile` directly into the extension manifest.
* **DevTools:** Completely optional (`ui.devtools.mode = "none" | "managed" | "external"`).

## ⏱ Content Lifecycle Timing

HexaJS provides a predictable, DOM-aware lifecycle for your Content Scripts.

* **`onInit()`:** Runs after framework bootstrap, but *only* after the document is ready for interaction. 
    * If `document.readyState` is `loading`, Hexa waits for the `DOMContentLoaded` event before executing `onInit()`.
    * If `document.readyState` is already `interactive` or `complete`, `onInit()` executes immediately.
* **`onDestroy()`:** Safely handles teardown. It always registers a `pagehide` fallback and will issue a console warning if the host page's Permissions Policy blocks the `unload` event.

## 📖 Example Configurations

Check out the generated examples to see how HexaJS fits into your workflow:

* **Managed UI:** [hexa-cli.managed-ui.example.json](examples/generated/hexa-cli.managed-ui.example.json) *(Example of a managed popup with no DevTools)*
* **External UI:** [hexa-cli.external-ui.example.json](examples/generated/hexa-cli.external-ui.example.json) *(Example configuring an external React popup)*
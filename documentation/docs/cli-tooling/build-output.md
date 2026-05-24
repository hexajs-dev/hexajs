---
title: Build Output
sidebar_position: 3
description: Understand the hexa build command, supported platforms, output directory structure, and how to configure builds per environment.
---

# Build Output

`hexa build` is the single command that compiles your extension. It runs the AOT pipeline, generates all context bootstraps, bundles each context, patches the manifest, and writes the final loadable extension to disk.

## Basic usage

```bash
hexa build --platform chrome
hexa build --platform firefox --mode production
hexa build --platform chrome --mode development --watch
```

There is no separate `hexa dev` command. Watch mode is `hexa build --watch`.

## Supported platforms

| Platform | `--platform` value | Notes |
|---|---|---|
| Chrome | `chrome` | Default. Chromium-compatible. |
| Edge | `edge` | Chromium-based; same output shape as Chrome. |
| Brave | `brave` | Chromium-based; same output shape as Chrome. |
| Opera | `opera` | Chromium-based; same output shape as Chrome. |
| Firefox | `firefox` | Separate manifest required. |
| Safari | `safari` | Separate manifest required. |

Each platform is configured independently inside `hexa-cli.config.json` under `environments.<mode>.platforms.<platform>`. This lets you point each platform at its own manifest file and output directory.

## Output directory structure

The output path follows the pattern `<outDir>/<mode>/`, where `outDir` is set per platform in config (e.g. `dist/chrome`). A full build for Chrome in development mode writes to `dist/chrome/development/`.

```
dist/
└── chrome/
    └── development/
        ├── manifest.json              ← generated & patched manifest
        ├── background/
        │   ├── background.bootstrap.js    ← AOT-generated background entry
        │   ├── background.validators.js   ← generated route validators
        │   ├── hexa-vendor-background.js  ← bundled vendor chunk
        │   ├── hexa-vendor-worker.js      ← vendor chunk for workers
        │   ├── hexa.worker.js             ← Hexa internal worker
        │   ├── hexa-offscreen.html        ← offscreen document (if used)
        │   └── worker-<name>.js           ← user-defined workers
        ├── content/
        │   ├── content-<hash>.js          ← bundled content script(s)
        │   └── content.validators.js      ← generated content validators
        ├── ui/
        │   ├── ui.bootstrap.js            ← UI context bootstrap
        │   ├── popup/
        │   │   ├── index.html
        │   │   └── assets/
        │   └── devtools/
        │       ├── index.html
        │       ├── devtools.html
        │       └── assets/
        └── assets/
            └── icons/                     ← extension icons
```

The `background/`, `content/`, and `ui/` directories map directly to the three extension runtime contexts. Each is independently bundled and tree-shaken.

## Platform-specific manifests

Each platform typically needs its own manifest file. You configure this per platform in `hexa-cli.config.json`:

```json
{
  "environments": {
    "development": {
      "platforms": {
        "chrome": {
          "outDir": "dist/chrome",
          "manifest": "manifest.chrome.json"
        },
        "firefox": {
          "outDir": "dist/firefox",
          "manifest": "manifest.firefox.json"
        }
      }
    }
  }
}
```

Hexa merges your manifest with its generated entries (background service worker, content scripts, UI pages). See [Manifest Patching](./manifest-patching.md) for the full merge behavior.

## Build modes

Modes map to `environments` keys in config. The two standard modes are `development` and `production`, but you can define any custom mode name.

```bash
hexa build --platform chrome --mode production
hexa build --platform chrome --mode staging   # custom mode
```

Compiler options can be overridden per mode:

```json
{
  "environments": {
    "production": {
      "compilerOptions": {
        "minify": "terser",
        "cssMinify": "lightningcss",
        "sourceMap": false
      }
    },
    "development": {
      "compilerOptions": {
        "minify": false,
        "sourceMap": true
      }
    }
  }
}
```

## Build targets

By default `hexa build` rebuilds all contexts. Use `--target` to rebuild only one:

| `--target` | What gets rebuilt |
|---|---|
| `all` (default) | background, content, UI, manifest |
| `background` | background context only |
| `content` | content scripts only |
| `ui` | managed UI surfaces only |

Partial targets are useful for faster iteration when you know only one context changed. Watch mode always uses `all`.

## Watch mode

```bash
hexa build --platform chrome --mode development --watch
```

Watch mode requires managed UI (`ui.popup.mode = "managed"` or `ui.devtools.mode = "managed"`). It starts an HMR server and rebuilds affected contexts on file changes.

In watch mode on Chromium-based platforms, Hexa automatically launches a browser with the unpacked extension loaded. Use `--no-auto-open-browser` to disable this.

See [HMR](./hmr.md) for the full behavior matrix per platform and context.

## Default platform and mode

Set defaults in config so you can run `hexa build` without flags:

```json
{
  "defaultPlatform": "chrome",
  "defaultMode": "development"
}
```

## Loading the output in a browser

After a build, load the output directory as an unpacked extension:

- **Chrome / Edge / Brave / Opera**: Go to `chrome://extensions`, enable Developer mode, click "Load unpacked", and select the output directory (e.g. `dist/chrome/development`).
- **Firefox**: Go to `about:debugging`, click "This Firefox", then "Load Temporary Add-on" and select the `manifest.json` inside the output directory.
- **Safari**: Use Xcode's Safari Web Extension converter or the Safari developer tools to load the output.

In watch mode on Chromium platforms, Hexa handles this automatically.

## Related pages

- Full command reference: [CLI Commands](./cli-commands.md)
- AOT compilation internals: [Build Pipeline](./build-pipeline.md)
- Manifest merge behavior: [Manifest Patching](./manifest-patching.md)
- Live reload behavior: [HMR](./hmr.md)

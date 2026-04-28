---
title: CLI Commands
sidebar_position: 2
description: Compact reference for all supported hexa CLI commands and options.
---

# CLI Commands

Hexa CLI command groups:

- `hexa new`
- `hexa build`
- `hexa add`
- `hexa generate`

## hexa new

Scaffold a new extension project.

```bash
hexa new [name] [--platform chrome,firefox,...]
```

| Argument / Option | Values | Notes |
|---|---|---|
| `[name]` | string | Prompted if omitted |
| `--platform` | chrome, firefox, safari, opera, edge, brave | Comma-separated list |

## hexa build

Compile and generate extension artifacts.

```bash
hexa build [--platform chrome] [--mode production] [--target all] [--watch]
```

| Option | Values | Default |
|---|---|---|
| `--platform` | chrome, firefox, safari, opera, edge, brave | chrome |
| `--mode` | development, production | config or production |
| `--target` | all, ui, content, background | all |
| `--verbose` | flag | false |
| `--watch` | flag | false |

Notes:
- Watch mode is driven by `hexa build --watch`.
- There is no separate `hexa dev` command.

### Compiler options (hexa-cli.config.json)

`compilerOptions` supports Vite-style build flags with Hexa camelCase keys:

| Key | Type | Notes |
|---|---|---|
| `minify` | `boolean \| "esbuild" \| "terser"` | `true` maps to `"esbuild"` |
| `cssMinify` | `boolean \| "esbuild" \| "lightningcss"` | CSS minifier strategy |
| `sourceMap` | `boolean \| "inline" \| "hidden"` | Mapped to Vite `build.sourcemap` |
| `terserOptions` | `object` | Used only when `minify: "terser"` |

Example profiles:

```json
{
  "compilerOptions": {
    "minify": false,
    "cssMinify": false,
    "sourceMap": true,
    "terserOptions": {}
  },
  "environments": {
    "production": {
      "compilerOptions": {
        "minify": "terser",
        "cssMinify": "lightningcss",
        "sourceMap": false,
        "terserOptions": {
          "compress": {
            "drop_console": true
          }
        }
      }
    }
  }
}
```

### UI options (hexa-cli.config.json)

| Key | Type | Default | Notes |
|---|---|---|---|
| `ui.parallelBuild` | `boolean` | `true` | Runs managed popup + managed devtools builds in parallel during standard build mode. Set to `false` to force sequential managed UI builds. |

## hexa add

Add feature blocks to an existing project.

### add content

```bash
hexa add content <name> <urlList> [--run-at document-idle]
```

### add background

```bash
hexa add background <name> [--allow-multiple]
```

### add ui

```bash
hexa add ui popup
hexa add ui devtools
```

### add handler

```bash
hexa add handler <name> <contentClass>
```

Shared options for add subcommands:
- `--cwd <path>`
- `--dry-run`
- `--force`
- `--verbose`

## hexa generate

Generate classes and store scaffolds.

### generate controller

```bash
hexa generate controller <name> [--namespace value]
```

### generate handler

```bash
hexa generate handler <name> [--namespace value]
```

### generate service

```bash
hexa generate service <name> <context>
```

Contexts: `background`, `content`, `general`, `ui`.

### generate reducer

```bash
hexa generate reducer <name> <context>
```

Contexts: `background`, `content`.

### generate state

```bash
hexa generate state <name> <context>
```

Requires an existing matching reducer file.

Shared options for generate subcommands:
- `--cwd <path>`
- `--dry-run`
- `--force`
- `--verbose`

### generate output directories

CLI schematics commands (`hexa generate ...` and `hexa add handler ...`) use fixed source-root directories:

- controllers: `src/background`
- handlers: `src/content`
- services: `src/services`

For reducers and state generation, directories are context-based under `src/background/store` and `src/content/store`.

## Where to go next

- Build internals and AOT behavior: [Build Pipeline](./build-pipeline.md)
- Output merge semantics: [Manifest Patching](./manifest-patching.md)
- Live reload behavior by platform: [HMR](./hmr.md)
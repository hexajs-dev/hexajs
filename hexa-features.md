- Hexa CLI with schematics
- AOT build, Enterprice ready scale.
- DI for background content and Managed UI (popup and devtools) context wise
- Browser agnostics build with managed layer ports package
- Managed UI for popup and devtools with hexa cli
- Store management context wise for background and content
- Controller for background communication support and Handlers for Content support with validation pipes
- Cross-Browser HMR - Get true Hot Module Replacement across Chrome, Firefox, and Safari without constantly restarting the browser or losing background state

---

## CLI Commands

### `hexa new [name]`

Scaffold a new HexaJS extension project.

| Argument / Option | Values | Notes |
|---|---|---|
| `[name]` | `string` | Optional; prompted interactively if omitted |
| `--platform <platforms>` | `chrome`, `firefox`, `safari`, `opera`, `edge`, `brave` | Comma-separated; prompted interactively if omitted |

**Interactive prompts** (triggered when args are omitted):
1. Project name
2. Target platforms _(multiselect, default: `chrome`)_
3. Add React popup?
4. Add managed React DevTools panel?

**Permutations:**
```
hexa new
hexa new <name>
hexa new <name> --platform chrome
hexa new <name> --platform chrome,firefox,edge
```

---

### `hexa build`

Compile the extension and generate HexaJS boilerplate.

| Option | Values | Default |
|---|---|---|
| `--platform <name>` | `chrome`, `firefox`, `safari`, `opera`, `edge`, `brave` | `chrome` |
| `--mode <name>` | `development`, `production` | from config / `production` |
| `--target <type>` | `all`, `ui`, `content`, `background` | `all` |
| `--verbose` | boolean flag | `false` |
| `--watch` | boolean flag | `false` — requires `--target all` and managed UI |

**Permutations:**
```
hexa build
hexa build --platform firefox
hexa build --platform chrome --mode development
hexa build --target ui
hexa build --target content --platform edge
hexa build --target background --verbose
hexa build --watch
```

---

### `hexa add`

Add extension building blocks to the current project.

**Shared options** (all subcommands): `--cwd <path>` · `--dry-run` · `--force` · `--verbose`

#### `hexa add content <name> <urlList>`
Add a content script class with URL match patterns.

| Argument / Option | Values | Notes |
|---|---|---|
| `<name>` | `string` | Class name; validated `/^[a-zA-Z][a-zA-Z0-9-_]*$/` |
| `<urlList>` | `string` | Comma-separated URL match patterns |
| `--run-at <value>` | `document-start`, `document-end`, `document-idle` | Default: `document-idle` |

```
hexa add content my-content "https://example.com/*"
hexa add content my-content "https://example.com/*,https://test.com/*" --run-at document-start
hexa add content sidebar "https://*.github.com/*" --dry-run
```

#### `hexa add background <name>`
Add a background service worker class.

| Argument / Option | Values | Notes |
|---|---|---|
| `<name>` | `string` | Class name |
| `--allow-multiple` | boolean flag | Allows adding a second `@Background`; errors without it if one already exists |

```
hexa add background my-background
hexa add background another-bg --allow-multiple --force
```

#### `hexa add ui <type>`
Add a managed UI surface.

| Argument | Values |
|---|---|
| `<type>` | `popup`, `devtools` |

```
hexa add ui popup
hexa add ui devtools
hexa add ui popup --dry-run
```

#### `hexa add handler <name> <contentClass>`
Attach a handler to an existing content class.

| Argument | Notes |
|---|---|
| `<name>` | Handler class name |
| `<contentClass>` | Existing content class to attach to |

```
hexa add handler my-handler MyContent
hexa add handler sidebar SidebarContent --force
```

---

### `hexa generate`

Generate HexaJS classes and store scaffolds.

**Shared options** (all subcommands): `--cwd <path>` · `--dry-run` · `--force` · `--verbose`

#### `hexa generate controller <name>`

| Option | Notes |
|---|---|
| `--namespace <value>` | Default: kebab-case of name |

```
hexa generate controller my-controller
hexa generate controller auth --namespace auth-controller
```

#### `hexa generate handler <name>`

| Option | Notes |
|---|---|
| `--namespace <value>` | Default: kebab-case of name |

```
hexa generate handler my-handler
hexa generate handler messaging --namespace msg-handler
```

#### `hexa generate service <name> <context>`

| Argument | Values |
|---|---|
| `<context>` | `background`, `content`, `general`, `ui` |

```
hexa generate service api background
hexa generate service ui-state ui
hexa generate service logger general --force
```

#### `hexa generate reducer <name> <context>`

| Argument | Values |
|---|---|
| `<context>` | `background`, `content` |

```
hexa generate reducer auth background
hexa generate reducer ui-state content
```

#### `hexa generate state <name> <context>`

Extend a context state configuration using an existing reducer. Requires a matching `<name>.reducer.ts` file to exist.

| Argument | Values |
|---|---|
| `<context>` | `background`, `content` |

```
hexa generate state auth background
hexa generate state ui content
hexa generate state cache background --dry-run
```




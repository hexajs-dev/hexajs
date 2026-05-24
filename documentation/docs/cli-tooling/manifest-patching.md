---
title: Manifest Patching
sidebar_position: 4
description: How HexaJS generates and patches manifest.json from your hexa-cli.config.json.
---

# Manifest Patching

HexaJS automatically generates a correct `manifest.json` for your target platform during build. You can optionally customize manifest fields beyond what the config offers.

> HexaJS supports **Manifest V3 (MV3) only**. Manifest V2 (MV2) is not supported.

## Quick Start: Icons

Configure your extension icon in **hexa-cli.config.json**:

```json
{
	"ui": {
		"popup": {
			"icons": "src/assets/icon.svg"  // Path to SVG or PNG
		}
	}
}
```

Hexa automatically generates **16×16, 32×32, 48×48, 128×128** PNG icons and updates the manifest. If no icon is configured, the framework fallback is used.

## How Manifest Generation Works

### 1. Platform Template

Hexa starts with a template for your target platform:

**Chromium-family** (Chrome, Edge, Brave, Opera):
- Uses `service_worker: "background.bootstrap.js"` for background script
- Supports all MV3 features

**Safari**:
- Uses `scripts: ["background.bootstrap.js"]` for background script
- Uses a classic background script context for worker compatibility
- Applies default `content_security_policy.extension_pages` with `wasm-unsafe-eval` for WebAssembly-based worker compatibility

**Firefox**:
- Uses `scripts: ["background.bootstrap.js"]` (not service_worker)
- Slightly different CSP handling

### 2. Project Metadata

Your project name and version from hexa-cli.config.json are applied:

```json
{
	"name": "my-extension",        // From project.name
	"version": "1.0.0"             // From project.version
}
```

### 3. Optional: User Manifest (Advanced)

For platform-specific customization, specify manifest files in your config:

```json
{
	"environments": {
		"development": {
			"platforms": {
				"chrome": {
					"outDir": "dist/chrome",
					"manifest": "manifest.chrome.json"     // Optional
				},
				"firefox": {
					"outDir": "dist/firefox",
					"manifest": "manifest.firefox.json"    // Optional
				}
			}
		}
	}
}
```

## Key fields managed automatically

| Field | Source |
|-------|--------|
| `background.service_worker` | Compiled background entry |
| `content_scripts[].js` | Compiled content entries + preserved user-provided external entries |
| `action.default_popup` | Managed UI popup entry |
| `devtools_page` | Managed DevTools entry |
| `icons` | Generated from SVG source |
| `permissions` | Merged from config `permissions[]` |

## Merge Rules

### Framework-Controlled Keys

These are always generated and cannot be overridden:

- `manifest_version` — Always 3
- `background` — Generated from compiled code
- `action` — Generated from UI config
- `devtools_page` — Generated from UI config

**Note on `content_scripts`**: Hexa always injects compiled content script entries. User-provided entries are preserved as additional entries (for example `external_content.js`), but generated entries cannot be removed.

**Why**: framework-owned fields must match compiled artifacts.

### User-Customizable Keys

When you provide a custom manifest file, these keys are merged:

- `name`, `version`, `description`
- `host_permissions`
- `permissions`
- `content_scripts` (additional user entries are preserved)
- `content_security_policy`
- `commands`
- `externally_connectable`
- `web_accessible_resources`
- `browser_specific_settings` (Firefox only)
- Any other custom keys

**Merge behavior**: User values override defaults *except* for framework-controlled keys. For `content_scripts`, Hexa-generated entries are always present and user entries are appended.

### Preserving External Content Scripts

You can keep externally-managed content scripts in a platform manifest file:

```json
{
	"content_scripts": [
		{
			"matches": ["https://example.com/*"],
			"js": ["external_content.js"],
			"run_at": "document_start"
		}
	]
}
```

During build, Hexa merges this with compiled content entries so both appear in the final `manifest.json`.

## Platform-Specific Examples

### Chrome/Chromium

**manifest.chrome.json**:

```json
{
	"host_permissions": ["https://api.example.com/*"],
	"permissions": ["storage", "tabs", "activeTab"],
	"commands": {
		"toggle-feature": {
			"suggested_key": {"default": "Ctrl+Shift+Y"},
			"description": "Toggle the feature"
		}
	}
}
```

### Firefox

**manifest.firefox.json**:

```json
{
	"host_permissions": ["https://api.example.com/*"],
	"permissions": ["storage", "tabs"],
	"browser_specific_settings": {
		"gecko": {
			"id": "my-extension@example.com"
		}
	}
}
```

Firefox supports `browser_specific_settings` for specifying the Add-on ID. Chromium browsers ignore this field.

### Safari

If you customize Safari CSP, keep `wasm-unsafe-eval` in `content_security_policy.extension_pages` when your extension uses WebAssembly (for example OCR with Tesseract). Removing it can break runtime worker initialization in Safari.

## Icon Generation

Hexa generates extension icons from a single source image:

```json
{
	"ui": {
		"popup": {
			"sourceDir": "ui/popup",
			"icons": "src/assets/icon.svg"     // Source file
		}
	}
}
```

### Resolution Process

1. Source image (SVG or PNG) is read from configured path
2. Resized to: 16, 32, 48, 128 pixels
3. Output as PNG to `dist/{platform}/icons/`
4. Manifest updated with icon references

If no icon is configured, the framework fallback is used.

### Supported Formats

- **SVG** (recommended) — Single vector source, automatically rasterized
- **PNG** — Pre-rendered raster image

### SVG Best Practices

- Keep one clean vector source for automatic rasterization
- Use simple paths; avoid complex filters
- Test at 16×16 for toolbar readability
- Verify appearance in light and dark contexts

## Content Security Policy (CSP)

Browser extensions enforce CSP at the **manifest level**, not via HTML `<meta>` tags. The `content_security_policy.extension_pages` field in `manifest.json` governs what scripts, styles, and connections are allowed on all extension pages (popup, devtools, newtab, options).

> HTML `<meta http-equiv="Content-Security-Policy">` tags are **ignored** by the browser in extension contexts. This is by design in Manifest V3 — the manifest is the single source of truth for extension CSP.

### Default Behavior by Platform

| Platform | Default CSP | Notes |
|----------|-------------|-------|
| Chrome, Edge, Brave, Opera | Browser-implicit `script-src 'self'` | No explicit field in manifest; browser applies its built-in default |
| Safari | `script-src 'self' 'wasm-unsafe-eval'; object-src 'self';` | Explicit in manifest — required for WebAssembly/worker compatibility |
| Firefox | Browser-implicit `script-src 'self'` | Same as Chromium family |

### Watch Mode CSP Patches

During `hexa build --watch`, the CLI automatically patches CSP for development:

- **Safari**: Adds `connect-src ws://127.0.0.1:<port>` for HMR WebSocket connections
- **Firefox**: Adds `http://localhost:5173` and `http://127.0.0.1:5173` to `script-src` for Vite dev server module loading
- **Chromium**: No CSP patch needed — Chrome allows localhost connections from extensions in development without explicit CSP

These patches are **only applied in watch mode** and never appear in production builds.

### Customizing CSP

To set a custom CSP, add `content_security_policy` to your platform manifest file:

```json title="manifest.chrome.json"
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  }
}
```

The CLI deep-merges your CSP with the platform template. If you provide `extension_pages`, your value replaces the default for that platform.

### Common CSP Directives for Extensions

| Directive | Purpose | Example |
|-----------|---------|---------|
| `script-src 'self'` | Allow only bundled scripts | Default for all platforms |
| `'wasm-unsafe-eval'` | Allow WebAssembly execution | Required for Tesseract OCR, SQLite, etc. |
| `object-src 'self'` | Restrict plugin/embed sources | Recommended baseline |
| `connect-src` | Control fetch/XHR/WebSocket targets | Add API domains if needed |

### Why No CSP Meta Tags in HTML?

You may notice that the built HTML files (popup, devtools, newtab) do not contain `<meta http-equiv="Content-Security-Policy">` tags. This is intentional:

1. **MV3 ignores them** — Chromium, Firefox, and Safari all enforce CSP from the manifest for extension pages, not from HTML meta tags.
2. **Single source of truth** — Having CSP in both the manifest and HTML would create confusion about which policy actually applies.
3. **Manifest CSP is stricter** — The browser's manifest-level enforcement cannot be relaxed by HTML meta tags, making them redundant.

If you need to verify what CSP is active on your extension pages, open DevTools on the page and check the **Application > Frames** panel or look for CSP headers in the **Network** tab.

## Practical Recommendations

- **Don't edit `manifest.json` in dist folders** — it's a generated artifact
- **Define manifest basics in `hexa-cli.config.json`** — project name, version, permissions
- **Use custom manifest files only when needed** — for platform-specific metadata
- **Icons are optional** — framework fallback is used if not provided

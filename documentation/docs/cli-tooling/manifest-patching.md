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

## Practical Recommendations

- **Don't edit `manifest.json` in dist folders** — it's a generated artifact
- **Define manifest basics in `hexa-cli.config.json`** — project name, version, permissions
- **Use custom manifest files only when needed** — for platform-specific metadata
- **Icons are optional** — framework fallback is used if not provided

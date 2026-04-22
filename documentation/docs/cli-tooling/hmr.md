---
title: HMR
sidebar_position: 5
description: Full Hot Module Replacement behavior matrix by platform and context.
---

import { Check, Zap, RotateCw } from 'lucide-react';

# HMR

HexaJS watch mode uses change-scoped rebuild and context-targeted reload behavior.

Command:

```bash
hexa build --watch
```

<p className="hmr-intro">
HexaJS intelligently triggers reload actions based on context changes to keep development fast and isolated.
</p>

<div className="hmr-checklist">
	<div className="hmr-check-item">
		<div className="hmr-check-title">UI changes trigger UI update path</div>
		<div className="hmr-check-subtitle">Managed UI surfaces hot-update without touching content or background runtime.</div>
	</div>
	<div className="hmr-check-item">
		<div className="hmr-check-title">Content changes trigger content update path</div>
		<div className="hmr-check-subtitle">Content scripts reload with context-scoped updates, preserving unrelated extension state.</div>
	</div>
	<div className="hmr-check-item">
		<div className="hmr-check-title">Background changes trigger background update path</div>
		<div className="hmr-check-subtitle">Background applies platform-specific strategy: patch flow when supported, reload fallback otherwise.</div>
	</div>
</div>

## Platform Matrix

Hot Module Replacement behavior varies by browser and context.

<table className="hmr-matrix-table">
	<thead>
		<tr>
			<th>Platform</th>
			<th>UI</th>
			<th>Content</th>
			<th>Background</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Chrome / Chromium</td>
			<td title="Full HMR"><Check size={15} className="hmr-cell-icon hmr-cell-icon-check" aria-label="Full HMR" /></td>
			<td title="Full HMR"><Check size={15} className="hmr-cell-icon hmr-cell-icon-check" aria-label="Full HMR" /></td>
			<td title="Debug patch with reload fallback"><Zap size={15} className="hmr-cell-icon hmr-cell-icon-patch" aria-label="Debug patch" /></td>
		</tr>
		<tr>
			<td>Firefox</td>
			<td title="Full HMR"><Check size={15} className="hmr-cell-icon hmr-cell-icon-check" aria-label="Full HMR" /></td>
			<td title="Full HMR"><Check size={15} className="hmr-cell-icon hmr-cell-icon-check" aria-label="Full HMR" /></td>
			<td title="Full HMR"><Check size={15} className="hmr-cell-icon hmr-cell-icon-check" aria-label="Full HMR" /></td>
		</tr>
		<tr>
			<td>Safari</td>
			<td title="Full HMR"><Check size={15} className="hmr-cell-icon hmr-cell-icon-check" aria-label="Full HMR" /></td>
			<td title="Full HMR"><Check size={15} className="hmr-cell-icon hmr-cell-icon-check" aria-label="Full HMR" /></td>
			<td title="Reload fallback"><RotateCw size={15} className="hmr-cell-icon hmr-cell-icon-reload" aria-label="Reload fallback" /></td>
		</tr>
	</tbody>
</table>

<div className="hmr-legend">
	<span className="hmr-legend-item"><Check size={14} className="hmr-cell-icon hmr-cell-icon-check" aria-hidden="true" /><span>Full HMR</span></span>
	<span className="hmr-legend-item"><Zap size={14} className="hmr-cell-icon hmr-cell-icon-patch" aria-hidden="true" /><span>Debug Patch</span></span>
	<span className="hmr-legend-item"><RotateCw size={14} className="hmr-cell-icon hmr-cell-icon-reload" aria-hidden="true" /><span>Reload Fallback</span></span>
</div>

## Chromium Background

Primary path:
- Uses debug-mode service-worker patch flow.

Requirement:
- Browser launched with remote debugging enabled.

Example launch flag:

```bash
--remote-debugging-port=9222
```

Fallback path:
- Extension reload.

Impact of fallback:
- Background devtools sessions close and must be reopened.

Trigger behavior:
- UI files changed -> UI hot update only.
- Content files changed -> content hot update only.
- Background files changed -> background patch or reload fallback only.

## Firefox

Firefox supports complete background patch flow in watch mode.

Result:
- UI/content/background can all hot-update with context-scoped triggers.

Trigger behavior:
- UI files changed -> UI hot update only.
- Content files changed -> content hot update only.
- Background files changed -> background hot update only.

## Safari

Safari supports full update flow for UI and content.

Background strategy:
- Extension reload fallback for background changes.
- Background devtools sessions close and need reopening.

Trigger behavior:
- UI files changed -> UI hot update only.
- Content files changed -> content hot update only.
- Background files changed -> extension reload fallback only.

## Trigger examples

- Change in popup React component: UI update only.
- Change in content handler: content update only.
- Change in background controller/service: background update strategy only.

## Best practices

- Keep background state persistence explicit when testing fallback reloads.
- Use feature flags for background experiments during watch.
- Avoid broad refactors across all contexts when investigating HMR behavior.
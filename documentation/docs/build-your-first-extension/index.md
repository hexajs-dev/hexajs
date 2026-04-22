---
title: Build Your First Extension
sidebar_position: 1
description: Build a minimal grayscale extension with a content-side eye toggle and a simple managed popup.
---

# Build Your First Extension

This section walks you through a complete, minimal HexaJS extension that you can run in a browser immediately.

The extension does exactly two things:

- It injects a small eye button on every page using a content-side Shadow DOM view.
- It toggles grayscale on and off for that specific page when you click the eye button.

The popup is intentionally simple and visual-only. It mirrors the style of the feature and helps you verify UI wiring without adding extra messaging complexity.

## What you will build

- A `@Content` entry that initializes and disposes page UI correctly.
- A content `@Injectable` service that owns grayscale state for the current page.
- A `@View` + `HexaView` pair that renders a React eye toggle in Shadow DOM.
- A minimal managed popup built with React.

## Why this tutorial matters

It covers the most important HexaJS concepts for first-time extension authors:

- Context boundaries (content vs popup vs background)
- Proper lifecycle cleanup
- Shadow DOM UI that does not clash with host-page CSS
- Small, testable responsibilities in each class

## Recommended flow

1. Read [Create a Grayscale Extension](./create-grayscale-extension.md)
2. Continue with [Designing Popup](./popup-preview.md)
3. Finish with [Running and Debugging](./running-and-debugging.md)

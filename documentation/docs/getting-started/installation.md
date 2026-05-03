---
title: Installation
sidebar_position: 2
description: Install HexaJS CLI and scaffold your first browser extension project.
---

# Getting Started with HexaJS

Welcome! This guide will walk you through setting up your environment, installing the Hexa CLI globally, and scaffolding your first cross-browser extension. By the end of this page, you will have a working project ready to load into Chrome or Firefox.
 
## Prerequisites

- Node.js ≥ 18
- pnpm, npm, or yarn

## Install the CLI

```bash
npm install -g @hexajs-dev/cli
```

If you prefer pnpm:

```bash
pnpm add -g @hexajs-dev/cli
```

## Scaffold a new project

```bash
hexa new hexa-extension
cd hexa-extension
```

The `hexa new` flow lets you choose your package manager (for example, npm or pnpm) and installs project dependencies automatically.

## Verify

```bash
hexa build --platform chrome
```

Your extension is now compiled and ready to be loaded into Chrome (or any Chromium-based browser, like Edge or Brave).

:::tip Cross-Browser Support
HexaJS is built for the modern web. You can easily target other browsers by changing the platform flag! Try running hexa build --platform firefox or hexa build --platform safari.
:::

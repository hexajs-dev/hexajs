<p align="center">
	<img src="./hexa-logo.svg" alt="HexaJS logo" width="92" />
</p>

<h1 align="center">HexaJS</h1>

<p align="center">
	Build browser extensions like real applications.
</p>

<p align="center">
	<a href="https://hexajs.dev">Website</a>
	·
	<a href="https://hexajs.dev/docs/getting-started">Docs</a>
	·
	<a href="https://github.com/hexajs-dev/hexajs/issues">Issues</a>
</p>

<p align="center">
	<img src="./documentation/static/img/city_q90~3.jpg" alt="HexaJS architecture city" />
</p>

HexaJS is a TypeScript-first framework for browser extension backends with a structured architecture for background, content, and state.

## What Makes HexaJS Different

- Browser-agnostic architecture with typed messaging across UI, content, and background.
- AOT-first build pipeline that discovers routes and generates context-ready artifacts before runtime.
- Controller-based calls with explicit namespace/action routing.
- Built-in state management for background and content contexts.
- Full HMR developer experience, including live behavior for background and content flows.

## Platform Support

- Manifest V3 (MV3) is fully supported.
- Manifest V2 (MV2) is not supported.

## UI Modes

- Managed popup (`ui.popup.mode = "managed"`): React-only mode. Hexa builds your popup source (default `ui/popup`) using the internal Vite pipeline.
- External popup (`ui.popup.mode = "external"`): Use any UI framework with your own build pipeline. Hexa copies built assets into the extension, but UI HMR is not managed by Hexa in this mode.
- Devtools remains optional (`ui.devtools.mode = "none" | "managed" | "external"`).

## Core Capabilities

- Browser-agnostic messaging: typed routes and ports reduce browser-specific glue code.
- Controller architecture: `@Controller` and `@Action` define clean background entry points.
- State management: reducer/effect/store model with reactive patterns for extension contexts.
- AOT build: compile-time metadata scan, route validation generation, and context-aware outputs.

## HMR That Matters

HexaJS provides a first-in-world extension workflow for practical live development across runtime contexts, including background/content lifecycle-aware updates.

- UI: full HMR in managed mode.
- Content: full HMR.
- Background: platform-specific live behavior with patch/reload fallback strategy.

See the complete matrix and behavior table in [HMR docs](documentation/docs/cli-tooling/hmr.md).

## Quick Start

```bash
npm install -g @hexajs-dev/cli
hexa new my-extension
cd my-extension
pnpm install
hexa build --platform chrome
```

Start development with watch mode:

```bash
hexa build --platform chrome --mode development --watch
```

## Documentation Map

- [Getting Started](documentation/docs/getting-started/index.md)
- [Core Fundamentals](documentation/docs/core-fundamentals/index.md)
- [Browser-Agnostic Messaging](documentation/docs/browser-agnostic-messaging/index.md)
- [State Management](documentation/docs/state-management/index.md)
- [Managed UI](documentation/docs/managed-ui/index.md)
- [CLI Tooling](documentation/docs/cli-tooling/index.md)
- [API Reference](documentation/docs/api-reference/index.md)

## Examples

- Managed popup/devtools-none config: [examples/generated/hexa-cli.managed-ui.example.json](examples/generated/hexa-cli.managed-ui.example.json)
- External React popup config: [examples/generated/hexa-cli.external-ui.example.json](examples/generated/hexa-cli.external-ui.example.json)
- Full example projects: [examples](examples)

## Contributing Policy

HexaJS is under active development and currently maintained with a closed-PR contribution model.

- External pull requests are not accepted at this time.
- Bugs are welcome through the bug template.
- Feature suggestions are welcome through the feature template.

Please use the structured templates so reports are reproducible, actionable, and easy to triage.

- Bug report: [New bug report](https://github.com/hexajs-dev/hexajs/issues/new?template=bug_report.yml)
- Feature suggestion: [New feature suggestion](https://github.com/hexajs-dev/hexajs/issues/new?template=feature_suggestion.yml)
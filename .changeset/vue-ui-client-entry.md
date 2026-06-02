---
"@hexajs-dev/ui": patch
"@hexajs-dev/cli": patch
---

Fix Vue (and non-React) managed UI builds failing with "Rollup failed to resolve import react-dom/client". Add a renderer-free `@hexajs-dev/ui/client` entry exporting only `HexaUIClient` (plus `sideEffects: false`), and point the CLI UI-bootstrap generator at it so the generated `ui.bootstrap.js` no longer pulls the React shadow renderer through the package barrel.

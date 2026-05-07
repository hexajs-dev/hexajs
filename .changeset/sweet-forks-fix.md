---
"@hexajs-dev/cli": patch
"@hexajs-dev/core": patch
"@hexajs-dev/ports": patch
"@hexajs-dev/ui": patch
---

Fix npm scaffolding dependency resolution by improving internal package linkage metadata and adding an npm ERESOLVE install retry fallback in hexa new.

import * as fs from 'fs';
import * as path from 'path';
import { normalizeManifestPath } from '../core/normalize';

export const DEVTOOLS_BRIDGE_FILE = 'devtools.html';

/**
 * Writes the devtools bridge page to `targetDir/devtools.html`.
 *
 * Chrome's `devtools_page` is a hidden background document — it is never rendered
 * visibly. Its sole job is to call `chrome.devtools.panels.create()` to register
 * a visible panel. The actual panel UI lives at `panelManifestPath`.
 *
 * @param targetDir       Absolute path to the `ui/devtools` output directory.
 * @param panelManifestPath  Extension-root-relative path to the panel HTML
 *                           (e.g. `"ui/devtools/index.html"`).
 * @param title           Panel tab title shown in Chrome DevTools (default: `"HexaJS"`).
 * @returns               Manifest-relative path to the bridge file.
 */
export function writeDevtoolsBridge(targetDir: string, panelManifestPath: string, title = 'HexaJS'): string {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body>
<script>
chrome.devtools.panels.create(
  ${JSON.stringify(title)},
  '',
  ${JSON.stringify(panelManifestPath)},
  function() {}
);
</script>
</body>
</html>
`;
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, DEVTOOLS_BRIDGE_FILE), html, 'utf-8');
  return normalizeManifestPath(path.posix.join('ui', 'devtools', DEVTOOLS_BRIDGE_FILE));
}

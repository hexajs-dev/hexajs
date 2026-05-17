import * as fs from 'fs';
import * as path from 'path';
import type { HexaUiSurface } from './types';
import { writeDevtoolsBridge } from '../devtools/bridge';
import { normalizeManifestPath } from './normalize';

/**
 * Generate a minimal fallback HTML page for a surface when no source is found.
 * Returns the manifest-relative path of the generated file.
 *
 * For devtools, generates a panel page inside `ui/devtools/` and a bridge page
 * that registers it via `chrome.devtools.panels.create()`.
 */
export function createFallbackSurface(surface: HexaUiSurface, outputDir: string): string {
  if (surface === 'devtools') {
    const targetDir = path.join(outputDir, 'ui', 'devtools');
    fs.mkdirSync(targetDir, { recursive: true });
    const panelHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>DevTools Panel</title>
</head>
<body>
  <h1>Hello from HexaJS DevTools</h1>
</body>
</html>
`;
    fs.writeFileSync(path.join(targetDir, 'index.html'), panelHtml, 'utf-8');
    console.log(`✓ Generated fallback devtools panel: ${path.join(targetDir, 'index.html')}`);
    return writeDevtoolsBridge(targetDir, 'ui/devtools/index.html');
  }

  if (surface === 'newtab') {
    const targetDir = path.join(outputDir, 'ui', 'newtab');
    fs.mkdirSync(targetDir, { recursive: true });
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>New Tab</title>
</head>
<body>
  <h1>Hello from HexaJS New Tab</h1>
</body>
</html>
`;
    const targetPath = path.join(targetDir, 'index.html');
    fs.writeFileSync(targetPath, html, 'utf-8');
    console.log(`✓ Generated fallback new tab page: ${targetPath}`);
    return normalizeManifestPath(path.posix.join('ui', 'newtab', 'index.html'));
  }

  const fileName = 'popup.html';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Popup</title>
</head>
<body>
  <h1>Hello from HexaJS Popup</h1>
</body>
</html>
`;

  const targetPath = path.join(outputDir, fileName);
  fs.writeFileSync(targetPath, html, 'utf-8');
  console.log(`✓ Generated fallback popup UI: ${targetPath}`);
  return fileName;
}
